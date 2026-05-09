import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import worker from "../src/worker.mjs";

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>AI chip stocks rally as earnings beat expectations - Reuters</title>
      <link>https://news.google.com/rss/articles/one</link>
      <pubDate>Sat, 09 May 2026 10:00:00 GMT</pubDate>
      <description>&lt;a&gt;AI chip stocks rally as earnings beat expectations&lt;/a&gt;&amp;nbsp;&amp;nbsp;&lt;font&gt;Reuters&lt;/font&gt;&lt;a&gt;Markets digest AI earnings&lt;/a&gt;&amp;nbsp;&amp;nbsp;&lt;font&gt;CNBC&lt;/font&gt;</description>
      <source url="https://www.reuters.com">Reuters</source>
    </item>
    <item>
      <title>Europe startups raise new climate fund - BBC</title>
      <link>https://news.google.com/rss/articles/two</link>
      <pubDate>Sat, 09 May 2026 09:00:00 GMT</pubDate>
      <description>&lt;a&gt;Europe startups raise new climate fund&lt;/a&gt;&amp;nbsp;&amp;nbsp;&lt;font&gt;BBC&lt;/font&gt;</description>
      <source url="https://www.bbc.com">BBC</source>
    </item>
  </channel>
</rss>`;

const marketCsv = `Symbol,Date,Time,Open,High,Low,Close,Volume,Name
^SPX,2026-05-09,16:00:00,100,110,90,105,123,Test Market`;

const env = {
  ASSETS: {
    fetch: () => new Response("asset", { status: 200 }),
  },
};

const ctx = {
  waitUntil: () => {},
};

function installCacheStub() {
  const store = new Map();
  Object.defineProperty(globalThis, "caches", {
    configurable: true,
    value: {
      default: {
        match: async (request) => store.get(request.url),
        put: async (request, response) => {
          store.set(request.url, response);
        },
      },
    },
  });
}

function installFetchStub() {
  globalThis.fetch = async (url) => {
    const href = String(url);

    if (href.includes("news.google.com")) {
      return new Response(rss, {
        status: 200,
        headers: { "Content-Type": "application/rss+xml" },
      });
    }

    if (href.includes("stooq.com")) {
      return new Response(marketCsv, {
        status: 200,
        headers: { "Content-Type": "text/csv" },
      });
    }

    throw new Error(`Unexpected fetch: ${href}`);
  };
}

async function json(path, options = {}) {
  const response = await worker.fetch(new Request(`https://signal-ledger.test${path}`, options), env, ctx);
  return {
    response,
    body: await response.json(),
  };
}

describe("Worker API", () => {
  beforeEach(() => {
    installCacheStub();
    installFetchStub();
  });

  it("returns a briefing with markets, sections, and clustered sources", async () => {
    const { response, body } = await json("/api/briefing");

    assert.equal(response.status, 200);
    assert.equal(body.markets.length, 6);
    assert.equal(body.sections.length, 6);
    assert.equal(body.lead.source, "Reuters");
    assert.equal(body.lead.clusterCount, 2);
    assert.deepEqual(body.lead.clusterSources.slice(0, 2), ["Reuters", "CNBC"]);
  });

  it("returns topic search results from /api/news", async () => {
    const { response, body } = await json("/api/news?topic=artificial%20intelligence");

    assert.equal(response.status, 200);
    assert.equal(body.topic, "artificial intelligence");
    assert.ok(body.articles.length > 0);
    assert.ok(body.articles[0].visualUrl);
  });

  it("stores newsletter signups when KV is configured", async () => {
    const writes = new Map();
    const kvEnv = {
      ...env,
      NEWSLETTER_SIGNUPS: {
        put: async (key, value) => {
          writes.set(key, JSON.parse(value));
        },
      },
    };

    const response = await worker.fetch(
      new Request("https://signal-ledger.test/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "reader@example.com" }),
      }),
      kvEnv,
      ctx,
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.storage, "cloudflare-kv");
    assert.equal(writes.get("signup:reader@example.com").email, "reader@example.com");
  });

  it("rejects invalid newsletter emails", async () => {
    const response = await worker.fetch(
      new Request("https://signal-ledger.test/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      }),
      env,
      ctx,
    );

    assert.equal(response.status, 400);
  });
});
