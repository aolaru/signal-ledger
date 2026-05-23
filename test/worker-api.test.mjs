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
      <enclosure url="https://cdn.example.test/ai-chip-stocks.jpg" type="image/jpeg" />
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
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);

    if (
      href.includes("news.google.com") ||
      href.includes("feeds.bbci.co.uk") ||
      href.includes("theguardian.com") ||
      href.includes("techcrunch.com/feed") ||
      href.includes("arstechnica.com") ||
      href.includes("cnbc.com") ||
      href.includes("romania-insider.com/feed")
    ) {
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

    if (href.includes("newsletter.example.test")) {
      const body = options.body ? JSON.parse(options.body) : {};
      return Response.json({ ok: true, email: body.email });
    }

    throw new Error(`Unexpected fetch: ${href}`);
  };
}

function createKvStore() {
  const store = new Map();
  return {
    store,
    binding: {
      get: async (key) => store.get(key) ?? null,
      put: async (key, value) => {
        store.set(key, value);
      },
    },
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
    assert.ok(body.lead.storyId);
    assert.ok(body.lead.storySlug);
    assert.ok(body.lead.canonicalPath.startsWith("/story/"));
    assert.equal(typeof body.lead.storyStored, "boolean");
    assert.ok(body.lead.clusterCount >= 1);
    assert.ok(body.lead.clusterSources.includes("Reuters"));
    assert.equal(body.lead.originalImageUrl, undefined);
    assert.equal(body.lead.feedSnippet, undefined);
    assert.ok(body.lead.thumbnailUrl.startsWith("data:image/svg+xml"));
    assert.ok(!body.lead.description.includes("Markets digest AI earnings"));
    assert.ok(
      new Set([body.lead, ...body.fastBriefing].filter(Boolean).map((story) => story.thumbnailUrl)).size > 1,
    );
  });

  it("returns topic search results from /api/news", async () => {
    const { response, body } = await json("/api/news?topic=artificial%20intelligence");

    assert.equal(response.status, 200);
    assert.equal(body.topic, "artificial intelligence");
    assert.ok(body.articles.length > 0);
    assert.ok(body.articles[0].visualUrl);
  });

  it("returns stored story briefs when STORY_BRIEFS is configured", async () => {
    const stories = createKvStore();
    const storyEnv = {
      ...env,
      STORY_BRIEFS: stories.binding,
    };

    const briefingResponse = await worker.fetch(new Request("https://signal-ledger.test/api/briefing"), storyEnv, ctx);
    const briefing = await briefingResponse.json();

    assert.equal(briefingResponse.status, 200);
    assert.equal(briefing.lead.storyStored, true);

    const storyResponse = await worker.fetch(
      new Request(`https://signal-ledger.test/api/story?id=${briefing.lead.storyId}`),
      storyEnv,
      ctx,
    );
    const storyBody = await storyResponse.json();

    assert.equal(storyResponse.status, 200);
    assert.equal(storyBody.story.storyId, briefing.lead.storyId);
    assert.equal(storyBody.story.source, "Reuters");
    assert.ok(storyBody.story.canonicalPath.startsWith("/story/"));
  });

  it("returns health diagnostics for feeds, newsletter, and story storage", async () => {
    const { response, body } = await json("/api/health");

    assert.equal(response.status, 200);
    assert.equal(body.storyStorage.provider, "url-fallback");
    assert.equal(body.newsletter.provider, "local-prototype");
    assert.equal(body.readiness[0].status, "action-needed");
    assert.ok(body.feeds.length >= 1);
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

  it("sends newsletter signups to a configured webhook provider", async () => {
    const response = await worker.fetch(
      new Request("https://signal-ledger.test/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "reader@example.com" }),
      }),
      {
        ...env,
        NEWSLETTER_WEBHOOK_URL: "https://newsletter.example.test/subscribe",
      },
      ctx,
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.provider, "webhook");
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

  it("serves the SPA shell for client-side routes", async () => {
    for (const path of ["/topic/markets", "/story/sample-brief", "/about", "/ops", "/briefing/today"]) {
      const response = await worker.fetch(new Request(`https://signal-ledger.test${path}`), env, ctx);

      assert.equal(response.status, 200);
      assert.equal(await response.text(), "asset");
    }
  });
});
