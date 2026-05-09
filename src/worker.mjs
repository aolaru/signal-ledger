import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
});

const sections = [
  { key: "business", label: "Business", query: "business economy companies" },
  { key: "tech", label: "Tech", query: "technology OR artificial intelligence" },
  { key: "markets", label: "Markets", query: "markets stocks economy" },
  { key: "world", label: "World", query: "world geopolitics" },
  { key: "europe", label: "Europe", query: "Europe economy politics business" },
  { key: "romania", label: "Romania", query: "Romania business economy technology politics" },
];

const marketSymbols = [
  { key: "spx", label: "S&P 500", symbol: "^spx" },
  { key: "nasdaq", label: "Nasdaq", symbol: "^ndq" },
  { key: "btc", label: "Bitcoin", symbol: "btcusd", currency: "$" },
  { key: "oil", label: "WTI oil", symbol: "cl.f", currency: "$" },
  { key: "gold", label: "Gold", symbol: "gc.f", currency: "$" },
  { key: "eurusd", label: "EUR/USD", symbol: "eurusd" },
];

const trustedSourceBoosts = new Map([
  ["Reuters", 40],
  ["AP News", 36],
  ["BBC", 32],
  ["CNBC", 28],
  ["Bloomberg.com", 28],
  ["The Wall Street Journal", 26],
  ["Financial Times", 26],
  ["The New York Times", 20],
  ["The Guardian", 16],
  ["Business Insider", 14],
]);

function jsonResponse(data, status = 200, cacheSeconds = 0) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
  };

  if (cacheSeconds > 0) {
    headers["Cache-Control"] = `public, max-age=${cacheSeconds}`;
  }

  return new Response(JSON.stringify(data), { status, headers });
}

async function cachedJson(request, ctx, cacheSeconds, producer) {
  const cache = caches.default;
  const cacheKey = new Request(request.url, { method: "GET" });
  const cached = await cache.match(cacheKey);

  if (cached) {
    return cached;
  }

  const response = jsonResponse(await producer(), 200, cacheSeconds);
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

function stripHtml(value = "") {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildFeedUrl(topic) {
  if (!topic) {
    return "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en";
  }

  const query = encodeURIComponent(topic);
  return `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
}

function getItems(channel) {
  if (!channel?.item) {
    return [];
  }

  return Array.isArray(channel.item) ? channel.item : [channel.item];
}

function getArticleId(article) {
  return article.title
    .toLowerCase()
    .replace(/[-–—|:]+.*$/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreArticle(article) {
  const publishedAt = new Date(article.publishedAt).getTime();
  const ageHours = Number.isNaN(publishedAt) ? 72 : (Date.now() - publishedAt) / 36e5;
  const sourceBoost = trustedSourceBoosts.get(article.source) || 0;
  const recencyScore = Math.max(0, 72 - ageHours);

  return sourceBoost + recencyScore;
}

function getWhyItMatters(article, fallbackTopic) {
  const cleanDescription = stripHtml(article.description || "");
  const firstSentence = cleanDescription.split(/(?<=[.!?])\s+/)[0];

  if (firstSentence && firstSentence.length > 45) {
    return firstSentence.length > 180 ? `${firstSentence.slice(0, 177)}...` : firstSentence;
  }

  return `This is moving the ${fallbackTopic.toLowerCase()} conversation and is worth tracking today.`;
}

async function fetchArticles(topic, limit = 12) {
  const response = await fetch(buildFeedUrl(topic), {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Google News request failed with ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml);
  const channel = parsed?.rss?.channel;

  return getItems(channel)
    .slice(0, Math.max(limit * 2, limit))
    .map((item) => {
      const sourceUrl = item.source?.["@_url"] || "";
      const article = {
        title: item.title || "Untitled article",
        link: item.link || "#",
        publishedAt: item.pubDate || "",
        source: item.source?.["#text"] || item.source || "Google News",
        sourceUrl,
        imageUrl: sourceUrl
          ? `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(sourceUrl)}&sz=128`
          : "/favicon.svg",
        description: stripHtml(item.description || ""),
      };

      return {
        ...article,
        whyItMatters: getWhyItMatters(article, topic || "Top stories"),
      };
    })
    .sort((first, second) => scoreArticle(second) - scoreArticle(first))
    .slice(0, limit);
}

function parseMarketCsv(csv, market) {
  const [, row = ""] = csv.trim().split("\n");
  const [symbol, date, time, open, high, low, close, , name] = row.split(",");
  const openValue = Number(open);
  const closeValue = Number(close);
  const percentChange =
    Number.isFinite(openValue) && openValue !== 0 && Number.isFinite(closeValue)
      ? ((closeValue - openValue) / openValue) * 100
      : 0;

  if (!closeValue || date === "N/D") {
    throw new Error(`No market data for ${market.symbol}`);
  }

  return {
    key: market.key,
    label: market.label,
    symbol,
    name,
    value: closeValue,
    open: openValue,
    high: Number(high),
    low: Number(low),
    percentChange,
    currency: market.currency || "",
    updatedAt: `${date}T${time.replace(/:00$/, ":00")}Z`,
  };
}

async function fetchMarket(market) {
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(market.symbol)}&f=sd2t2ohlcvn&h&e=csv`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Market request failed with ${response.status}`);
  }

  return parseMarketCsv(await response.text(), market);
}

async function fetchMarkets() {
  const markets = [];

  for (const market of marketSymbols) {
    try {
      markets.push(await fetchMarket(market));
    } catch (error) {
      console.warn(`Skipping ${market.label}: ${error.message}`);
    }
  }

  return markets;
}

async function buildBriefing() {
  const [topStories, markets, ...sectionFeeds] = await Promise.all([
    fetchArticles("business technology markets geopolitics", 10),
    fetchMarkets(),
    ...sections.map((section) => fetchArticles(section.query, 8)),
  ]);

  const seen = new Set(topStories.map(getArticleId));
  const sectionData = sections.map((section, index) => {
    const articles = sectionFeeds[index].filter((article) => {
      const id = getArticleId(article);
      if (seen.has(id)) {
        return false;
      }

      seen.add(id);
      return true;
    });

    return {
      key: section.key,
      label: section.label,
      articles,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    lead: topStories[0],
    fastBriefing: topStories.slice(1, 9),
    markets,
    sections: sectionData,
  };
}

async function handleApi(request, ctx) {
  const url = new URL(request.url);

  try {
    if (url.pathname === "/api/briefing") {
      return cachedJson(request, ctx, 600, buildBriefing);
    }

    if (url.pathname === "/api/markets") {
      return cachedJson(request, ctx, 60, async () => ({
        generatedAt: new Date().toISOString(),
        markets: await fetchMarkets(),
      }));
    }

    if (url.pathname === "/api/news") {
      const topic = url.searchParams.get("topic")?.trim() || "";
      return cachedJson(request, ctx, 600, async () => ({
        topic: topic || "Top stories",
        articles: await fetchArticles(topic, 12),
      }));
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (error) {
    return jsonResponse(
      {
        error: "Could not load data right now.",
        details: error.message,
      },
      500,
    );
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, ctx);
    }

    return env.ASSETS.fetch(request);
  },
};
