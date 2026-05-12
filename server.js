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
const storyStore = new Map();
const newsCacheMs = 10 * 60 * 1000;
const marketCacheMs = 60 * 1000;

const sections = [
  {
    key: "business",
    label: "Business",
    query: "business economy companies",
    feeds: [
      { name: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml" },
      { name: "The Guardian Business", url: "https://www.theguardian.com/business/rss" },
      { name: "CNBC", url: "https://www.cnbc.com/id/10001147/device/rss/rss.html" },
    ],
  },
  {
    key: "tech",
    label: "Tech",
    query: "technology OR artificial intelligence",
    feeds: [
      { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
      { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index" },
    ],
  },
  {
    key: "markets",
    label: "Markets",
    query: "markets stocks economy",
    feeds: [
      { name: "CNBC Markets", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html" },
      { name: "The Guardian Business", url: "https://www.theguardian.com/business/rss" },
    ],
  },
  {
    key: "world",
    label: "World",
    query: "world geopolitics",
    feeds: [
      { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
      { name: "The Guardian World", url: "https://www.theguardian.com/world/rss" },
    ],
  },
  {
    key: "europe",
    label: "Europe",
    query: "Europe economy politics business",
    feeds: [
      { name: "BBC Europe", url: "https://feeds.bbci.co.uk/news/world/europe/rss.xml" },
      { name: "The Guardian Europe", url: "https://www.theguardian.com/world/europe-news/rss" },
    ],
  },
  {
    key: "romania",
    label: "Romania",
    query: "Romania business economy technology politics",
    feeds: [{ name: "Romania Insider", url: "https://www.romania-insider.com/feed" }],
  },
];

const briefingFeeds = [
  ...sections.find((section) => section.key === "business").feeds,
  ...sections.find((section) => section.key === "tech").feeds,
  ...sections.find((section) => section.key === "markets").feeds,
  ...sections.find((section) => section.key === "world").feeds,
];

const marketSymbols = [
  { key: "spx", label: "S&P 500", symbols: ["^spx", "%5Espx"] },
  { key: "nasdaq", label: "Nasdaq", symbols: ["^ndq", "%5Endq"] },
  { key: "btc", label: "Bitcoin", symbols: ["btcusd"], currency: "$" },
  { key: "oil", label: "WTI oil", symbols: ["cl.f"], currency: "$" },
  { key: "gold", label: "Gold", symbols: ["gc.f"], currency: "$" },
  { key: "eurusd", label: "EUR/USD", symbols: ["eurusd"] },
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

const trustedSourceBoosts = new Map([
  ["Reuters", 40],
  ["AP News", 36],
  ["BBC News", 32],
  ["BBC", 32],
  ["CNBC", 28],
  ["Bloomberg.com", 28],
  ["The Wall Street Journal", 26],
  ["Financial Times", 26],
  ["The New York Times", 20],
  ["The Guardian", 16],
  ["TechCrunch", 16],
  ["Business Insider", 14],
  ["Romania Insider", 12],
]);

function stripHtml(value = "") {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanTitle(title = "") {
  return title.replace(/\s[-|]\s[^-|]+$/, "").trim() || title;
}

function slugify(value = "") {
  const slug = value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 82);

  return slug || "briefing";
}

function hashString(value = "") {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
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

function extractClusterSources(description = "", primarySource = "") {
  const sources = [...description.matchAll(/<font[^>]*>(.*?)<\/font>/gi)]
    .map((match) => decodeEntities(stripHtml(match[1])))
    .filter(Boolean);

  return [...new Set([primarySource, ...sources].filter(Boolean))];
}

function getItems(channel) {
  if (!channel?.item) {
    return [];
  }

  return Array.isArray(channel.item) ? channel.item : [channel.item];
}

function getArticleId(article) {
  return cleanTitle(article.title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreArticle(article) {
  const publishedAt = new Date(article.publishedAt).getTime();
  const ageHours = Number.isNaN(publishedAt) ? 72 : (Date.now() - publishedAt) / 36e5;
  const sourceBoost = trustedSourceBoosts.get(article.source) || 0;
  const recencyScore = Math.max(0, 72 - ageHours);
  const providerBoost = article.provider === "rss-direct" ? 8 : 0;

  return sourceBoost + recencyScore + providerBoost;
}

function getWhyItMatters(article, fallbackTopic) {
  const cleanDescription = stripHtml(article.description || "");
  const firstSentence = cleanDescription.split(/(?<=[.!?])\s+/)[0];

  if (firstSentence && firstSentence.length > 45) {
    return firstSentence.length > 180 ? `${firstSentence.slice(0, 177)}...` : firstSentence;
  }

  return `This is moving the ${fallbackTopic.toLowerCase()} conversation and is worth tracking today.`;
}

function buildArticle(item, topic, sourceFallback, provider) {
  const link =
    (typeof item.link === "string" ? item.link : item.link?.href || item.guid?.["#text"] || item.guid || "#").trim();
  const sourceUrl =
    item.source?.["@_url"] ||
    item.sourceUrl ||
    (link.startsWith("http") ? new URL(link).origin : "");
  const source =
    item.source?.["#text"] ||
    (typeof item.source === "string" ? item.source : "") ||
    sourceFallback ||
    "Google News";
  const rawDescription = item.description || item["content:encoded"] || item.summary || "";
  const clusterSources =
    provider === "google-news" ? extractClusterSources(rawDescription, source) : [source].filter(Boolean);
  const title = cleanTitle(item.title || "Untitled article");
  const storyId = hashString(`${link}|${source}|${title}`);

  const article = {
    storyId,
    storySlug: slugify(title),
    storyStored: true,
    title,
    link,
    publishedAt: item.pubDate || item.published || item.updated || "",
    source,
    sourceUrl,
    imageUrl: sourceUrl
      ? `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(sourceUrl)}&sz=128`
      : "/favicon.svg",
    visualUrl: getVisualUrl(topic, title),
    clusterSources,
    clusterCount: clusterSources.length,
    description: stripHtml(rawDescription),
    provider,
  };

  return {
    ...article,
    whyItMatters: getWhyItMatters(article, topic || "Top stories"),
  };
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

async function fetchRss(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
      "User-Agent": "Mozilla/5.0 SignalLedger/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`RSS request failed with ${response.status}`);
  }

  return parser.parse(await response.text());
}

async function fetchFeedArticles(feed, topic, limit = 12) {
  const parsed = await fetchRss(feed.url);
  const channel = parsed?.rss?.channel || parsed?.feed;

  return getItems(channel)
    .slice(0, Math.max(limit * 2, limit))
    .map((item) => buildArticle(item, topic, feed.name, "rss-direct"))
    .sort((first, second) => scoreArticle(second) - scoreArticle(first))
    .slice(0, limit);
}

async function fetchGoogleNewsArticles(topic, limit = 12) {
  const parsed = await fetchRss(buildFeedUrl(topic));
  const channel = parsed?.rss?.channel;

  return getItems(channel)
    .slice(0, Math.max(limit * 2, limit))
    .map((item) => buildArticle(item, topic, "Google News", "google-news"))
    .sort((first, second) => scoreArticle(second) - scoreArticle(first))
    .slice(0, limit);
}

function dedupeArticles(articles, limit) {
  const seen = new Set();

  return articles
    .filter((article) => {
      const key = article.storyId || getArticleId(article);
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort((first, second) => scoreArticle(second) - scoreArticle(first))
    .slice(0, limit);
}

function persistStories(stories) {
  for (const story of stories) {
    storyStore.set(story.storyId, story);
  }

  return stories;
}

async function fetchArticles(topic, limit = 12, feeds = []) {
  const cacheKey = `${topic || "top"}:${limit}:${feeds.map((feed) => feed.url).join("|")}`;
  const cached = readCache(newsCache, cacheKey);
  if (cached) {
    return cached;
  }

  const directResults = await Promise.allSettled(feeds.map((feed) => fetchFeedArticles(feed, topic, limit)));
  const directArticles = directResults
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value);

  const googleArticles =
    directArticles.length >= limit ? [] : await fetchGoogleNewsArticles(topic, Math.max(limit, limit * 2));
  const articles = dedupeArticles([...directArticles, ...googleArticles], limit);

  persistStories(articles);
  writeCache(newsCache, cacheKey, articles, newsCacheMs);
  return articles;
}

function collectStories(briefing) {
  return dedupeArticles(
    [briefing.lead, ...briefing.fastBriefing, ...briefing.sections.flatMap((section) => section.articles)].filter(Boolean),
    100,
  );
}

async function buildBriefing() {
  const [topStories, markets, ...sectionFeeds] = await Promise.all([
    fetchArticles("business technology markets geopolitics", 10, briefingFeeds),
    fetchMarkets(),
    ...sections.map((section) => fetchArticles(section.query, 8, section.feeds)),
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

  const briefing = {
    generatedAt: new Date().toISOString(),
    lead: topStories[0],
    fastBriefing: topStories.slice(1, 9),
    markets,
    sections: sectionData,
  };

  persistStories(collectStories(briefing));
  return briefing;
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
    throw new Error(`No market data for ${market.key}`);
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
    provider: "stooq",
    isFallback: false,
  };
}

async function fetchMarket(market) {
  const cached = readCache(marketCache, market.key);
  if (cached) {
    return cached;
  }

  const errors = [];

  for (const symbol of market.symbols) {
    const symbolParam = symbol.startsWith("%") ? symbol : encodeURIComponent(symbol);
    const url = `https://stooq.com/q/l/?s=${symbolParam}&f=sd2t2ohlcvn&h&e=csv`;
    const response = await fetch(url, {
      headers: {
        Accept: "text/csv,*/*",
        "User-Agent": "Mozilla/5.0 SignalLedger/1.0",
      },
    });

    if (!response.ok) {
      errors.push(`${symbol}: ${response.status}`);
      continue;
    }

    try {
      const data = parseMarketCsv(await response.text(), market);
      writeCache(marketCache, market.key, data, marketCacheMs);
      return data;
    } catch (error) {
      errors.push(`${symbol}: ${error.message}`);
    }
  }

  throw new Error(errors.join("; ") || `No market data for ${market.key}`);
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
        provider: "fallback-snapshot",
      })),
  ];
}

async function subscribeWithButtondown(email) {
  const response = await fetch("https://api.buttondown.com/v1/subscribers", {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.BUTTONDOWN_API_KEY}`,
      "Content-Type": "application/json",
      "X-Buttondown-Collision-Behavior": "add",
    },
    body: JSON.stringify({
      email_address: email,
      type: "regular",
      tags: ["signalledger"],
      notes: "Subscribed from SignalLedger website",
    }),
  });

  if (!response.ok && response.status !== 409) {
    const text = await response.text();
    throw new Error(`Buttondown subscribe failed: ${response.status} ${text.slice(0, 120)}`);
  }

  return "buttondown";
}

async function subscribeWithKit(email) {
  const response = await fetch("https://api.kit.com/v4/subscribers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Kit-Api-Key": process.env.KIT_API_KEY,
    },
    body: JSON.stringify({
      email_address: email,
      state: "active",
      fields: {
        Source: "SignalLedger website",
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Kit subscribe failed: ${response.status} ${text.slice(0, 120)}`);
  }

  return "kit";
}

async function subscribeWithWebhook(email) {
  const response = await fetch(process.env.NEWSLETTER_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      source: "signalledger-web",
      createdAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Newsletter webhook failed: ${response.status} ${text.slice(0, 120)}`);
  }

  return "webhook";
}

function findSectionFeeds(topic = "") {
  const normalized = topic.trim().toLowerCase();
  return sections.find((section) => {
    const label = section.label.toLowerCase();
    return normalized === section.key || normalized === label || normalized.includes(section.key);
  })?.feeds;
}

app.use(express.static(path.join(__dirname, "public")));

app.get(/^\/topic\/.+/, (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get(/^\/story\/.+/, (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get(["/about", "/briefing/today"], (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/briefing", async (_req, res) => {
  try {
    res.json(await buildBriefing());
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

app.get("/api/story", (req, res) => {
  const storyId = typeof req.query.id === "string" ? req.query.id.trim() : "";
  const story = storyStore.get(storyId);

  if (!story) {
    res.status(404).json({ error: "Story not found." });
    return;
  }

  res.json({ story });
});

app.post("/api/subscribe", express.json(), async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }

  try {
    let provider = "local-prototype";

    if (process.env.BUTTONDOWN_API_KEY) {
      provider = await subscribeWithButtondown(email);
    } else if (process.env.KIT_API_KEY) {
      provider = await subscribeWithKit(email);
    } else if (process.env.NEWSLETTER_WEBHOOK_URL) {
      provider = await subscribeWithWebhook(email);
    }

    res.json({
      ok: true,
      message:
        provider === "local-prototype"
          ? "Subscription captured locally. Configure a newsletter provider to send subscribers to a real list."
          : `Subscription forwarded to ${provider}.`,
      provider,
    });
  } catch (error) {
    res.status(500).json({
      error: "Could not subscribe right now.",
      details: error.message,
    });
  }
});

app.get("/api/news", async (req, res) => {
  try {
    const topic = typeof req.query.topic === "string" ? req.query.topic.trim() : "";
    const feeds = findSectionFeeds(topic) || [];
    const articles = await fetchArticles(topic, 12, feeds);

    res.json({
      topic: topic || "Top stories",
      articles,
    });
  } catch (error) {
    res.status(500).json({
      error: "Could not load news right now.",
      details: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
