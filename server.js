const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "public");
const localCache = new Map();

function ensureWorkerCache() {
  if (globalThis.caches) {
    return;
  }

  globalThis.caches = {
    default: {
      match: async (request) => localCache.get(request.url)?.clone(),
      put: async (request, response) => {
        localCache.set(request.url, response.clone());
      },
    },
  };
}

function getWorkerEnv() {
  return {};
}

function getWorkerContext() {
  return {
    waitUntil: (promise) => {
      Promise.resolve(promise).catch((error) => {
        console.error("Worker background task failed:", error);
      });
    },
  };
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function getRequestHeaders(req) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  return headers;
}

ensureWorkerCache();
const workerPromise = import("./src/worker.mjs").then((module) => module.default);

app.use(express.static(publicDir));

app.all(/^\/api(?:\/.*)?$/, async (req, res) => {
  try {
    const worker = await workerPromise;
    const body = req.method === "GET" || req.method === "HEAD" ? undefined : await getRequestBody(req);
    const request = new Request(`http://localhost:${port}${req.originalUrl}`, {
      method: req.method,
      headers: getRequestHeaders(req),
      body: body?.length ? body : undefined,
    });
    const response = await worker.fetch(request, getWorkerEnv(), getWorkerContext());

    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    res.status(500).json({
      error: "Local Worker request failed.",
      details: error.message,
    });
  }
});

app.get(/^\/topic\/.+/, (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get(/^\/story\/.+/, (_req, res) => {
  res.redirect(301, "/");
});

app.get("/briefing/today", (_req, res) => {
  res.redirect(301, "/");
});

app.get(["/about", "/privacy", "/terms", "/contact"], (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
