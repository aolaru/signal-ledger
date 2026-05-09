const express = require("express");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");

const app = express();
const port = process.env.PORT || 3000;
const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
});

const newsCache = new Map();
const marketCache = new Map();
const newsCacheMs = 10 * 60 * 1000;
const marketCacheMs = 60 * 1000;
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

const fallbackMarkets = [
  { key: "spx", label: "S&P 500", symbol: "^SPX", value: 7398.9, percentChange: 0.49, currency: "" },
  { key: "nasdaq", label: "Nasdaq", symbol: "^NDQ", value: 26247.08, percentChange: 1.11, currency: "" },
  { key: "btc", label: "Bitcoin", symbol: "BTCUSD", value: 80142.3, percentChange: 0.51, currency: "$" },
  { key: "oil", label: "WTI oil", symbol: "CL.F", value: 95.42, percentChange: -2.88, currency: "$" },
  { key: "gold", label: "Gold", symbol: "GC.F", value: 4730.7, percentChange: 1.03, currency: "$" },
  { key: "eurusd", label: "EUR/USD", symbol: "EURUSD", value: 1.17803, percentChange: 0.48, currency: "" },
];

const visualPresets = [
  {
    match: /romania|bucharest|cluj|cee/i,
    url: "https://images.unsplash.com/photo-1584646098378-0874589d76b1?auto=format&fit=crop&w=900&q=80",
  },
  {
    match: /europe|eu\b|brussels|eurozone/i,
    url: "https://images.unsplash.com/photo-1491557345352-5929e343eb89?auto=format&fit=crop&w=900&q=80",
  },
  {
    match: /market|stock|economy|fed|inflation|oil|gold|bitcoin|crypto/i,
    url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=900&q=80",
  },
  {
    match: /tech|ai|artificial intelligence|startup|software|chip/i,
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
  },
  {
    match: /world|geopolitics|china|iran|russia|war|defense/i,
    url: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=900&q=80",
  },
  {
    match: /business|company|earnings|deal|ceo/i,
    url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
  },
];

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

function getVisualUrl(topic, title = "") {
  const haystack = `${topic} ${title}`;
  return (
    visualPresets.find((preset) => preset.match.test(haystack))?.url ||
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80"
  );
}

function readCache(cache, key) {
  const cached = cache.get(key);
  if (!cached || Date.now() - cached.createdAt > cached.ttl) {
    return null;
  }

  return cached.value;
}

function writeCache(cache, key, value, ttl) {
  cache.set(key, {
    createdAt: Date.now(),
    ttl,
    value,
  });
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
  const cacheKey = `${topic || "top"}:${limit}`;
  const cached = readCache(newsCache, cacheKey);
  if (cached) {
    return cached;
  }

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

  const articles = getItems(channel)
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
        visualUrl: getVisualUrl(topic, item.title || ""),
        description: stripHtml(item.description || ""),
      };

      return {
        ...article,
        whyItMatters: getWhyItMatters(article, topic || "Top stories"),
      };
    })
    .sort((first, second) => scoreArticle(second) - scoreArticle(first))
    .slice(0, limit);

  writeCache(newsCache, cacheKey, articles, newsCacheMs);
  return articles;
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
  const cached = readCache(marketCache, market.key);
  if (cached) {
    return cached;
  }

  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(market.symbol)}&f=sd2t2ohlcvn&h&e=csv`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Market request failed with ${response.status}`);
  }

  const csv = await response.text();
  const data = parseMarketCsv(csv, market);
  writeCache(marketCache, market.key, data, marketCacheMs);
  return data;
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

  if (markets.length === marketSymbols.length) {
    return markets;
  }

  const liveKeys = new Set(markets.map((market) => market.key));
  const fallbackUpdatedAt = new Date().toISOString();
  return [
    ...markets,
    ...fallbackMarkets
      .filter((market) => !liveKeys.has(market.key))
      .map((market) => ({
        ...market,
        updatedAt: fallbackUpdatedAt,
        isFallback: true,
      })),
  ];
}

app.use(express.static(path.join(__dirname, "public")));

app.get(/^\/topic\/.+/, (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/briefing", async (_req, res) => {
  try {
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

    res.json({
      generatedAt: new Date().toISOString(),
      lead: topStories[0],
      fastBriefing: topStories.slice(1, 9),
      markets,
      sections: sectionData,
    });
  } catch (error) {
    res.status(500).json({
      error: "Could not load the briefing right now.",
      details: error.message,
    });
  }
});

app.get("/api/markets", async (_req, res) => {
  try {
    res.json({
      generatedAt: new Date().toISOString(),
      markets: await fetchMarkets(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Could not load market data right now.",
      details: error.message,
    });
  }
});

app.post("/api/subscribe", express.json(), (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }

  res.json({
    ok: true,
    message: "Subscription captured for the prototype.",
  });
});

app.get("/api/news", async (req, res) => {
  try {
    const topic = typeof req.query.topic === "string" ? req.query.topic.trim() : "";
    const articles = await fetchArticles(topic, 12);

    res.json({
      topic: topic || "Top stories",
      articles,
    });
  } catch (error) {
    res.status(500).json({
      error: "Could not load Google News right now.",
      details: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
