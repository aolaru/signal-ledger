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
    fetch: (request) => {
      const pathname = new URL(request.url).pathname;
      return pathname === "/" ? new Response("asset", { status: 200 }) : new Response("missing", { status: 404 });
    },
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

    throw new Error(`Unexpected fetch: ${href}`);
  };
}

async function json(path, options = {}) {
  const response = await worker.fetch(new Request(`https://kreativtools.test${path}`, options), env, ctx);
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

  it("returns a compact briefing with markets, sections, and thumbnail metadata", async () => {
    const { response, body } = await json("/api/briefing");

    assert.equal(response.status, 200);
    assert.equal(body.markets.length, 6);
    assert.equal(body.sections.length, 6);
    assert.equal(body.editorialBrief.title, "What to scan first");
    assert.ok(body.editorialBrief.summary.includes("Start with the lead story"));
    assert.ok(body.editorialBrief.signals.length >= 3);
    assert.equal(body.lead.source, "Reuters");
    assert.ok(body.lead.storyId);
    assert.equal(body.lead.feedSnippet, undefined);
    assert.equal(body.lead.thumbnailUrl, undefined);
    assert.equal(body.lead.visualUrl, undefined);
    assert.equal(body.lead.imageUrl, undefined);
    assert.ok(body.lead.thumbnail.initials);
    assert.ok(Number.isInteger(body.lead.thumbnail.variant));
    assert.ok(!body.lead.description.includes("Markets digest AI earnings"));
    assert.ok(!body.lead.description.includes(body.lead.title));
    assert.ok(!JSON.stringify(body).includes("data:image"));
    assert.ok(
      new Set(
        [body.lead, ...body.fastBriefing]
          .filter(Boolean)
          .map((story) => `${story.thumbnail.tone}-${story.thumbnail.variant}-${story.thumbnail.initials}`),
      ).size > 1,
    );
  });

  it("returns fixed topic results from /api/news", async () => {
    const { response, body } = await json("/api/news?topic=artificial%20intelligence");

    assert.equal(response.status, 200);
    assert.equal(body.topic, "artificial intelligence");
    assert.ok(body.articles.length > 0);
    assert.ok(body.articles[0].thumbnail.initials);
    assert.equal(body.articles[0].visualUrl, undefined);
  });

  it("rejects unsupported topics from /api/news", async () => {
    const { response, body } = await json("/api/news?topic=startups");

    assert.equal(response.status, 404);
    assert.equal(body.error, "Topic not available.");
    assert.ok(body.availableTopics.includes("markets"));
  });

  it("returns health diagnostics for feeds and readiness", async () => {
    const { response, body } = await json("/api/health");

    assert.equal(response.status, 200);
    assert.equal(body.readiness[0].status, "ready");
    assert.ok(body.feeds.length >= 1);
  });

  it("serves the SPA shell for client-side routes", async () => {
    for (const path of ["/topic/markets", "/about", "/privacy", "/terms", "/contact"]) {
      const response = await worker.fetch(new Request(`https://kreativtools.test${path}`), env, ctx);

      assert.equal(response.status, 200);
      assert.equal(await response.text(), "asset");
    }
  });

  it("does not expose the retired operations route as a public SPA page", async () => {
    const response = await worker.fetch(new Request("https://kreativtools.test/ops"), env, ctx);

    assert.equal(response.status, 404);
    assert.equal(await response.text(), "missing");
  });

  it("redirects retired story and today duplicate routes", async () => {
    for (const path of ["/story/sample-brief", "/briefing/today"]) {
      const response = await worker.fetch(new Request(`https://kreativtools.test${path}`), env, ctx);

      assert.equal(response.status, 301);
      assert.equal(response.headers.get("location"), "https://kreativtools.test/");
    }
  });
});
