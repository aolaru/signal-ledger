import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
});

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
    relevance: {
      include: [
        "business",
        "company",
        "companies",
        "economy",
        "earnings",
        "revenue",
        "profit",
        "deal",
        "merger",
        "ceo",
        "consumer",
        "retail",
        "startup",
      ],
      minimumScore: 1,
    },
  },
  {
    key: "tech",
    label: "Tech",
    query: "technology OR artificial intelligence",
    feeds: [
      { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
      { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index" },
    ],
    relevance: {
      include: [
        "technology",
        "tech",
        "ai",
        "artificial intelligence",
        "software",
        "chip",
        "semiconductor",
        "startup",
        "app",
        "cybersecurity",
        "cloud",
        "spacex",
        "rocket",
      ],
      minimumScore: 1,
    },
  },
  {
    key: "markets",
    label: "Markets",
    query: "markets stocks economy",
    feeds: [
      { name: "CNBC Markets", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html" },
      { name: "The Guardian Business", url: "https://www.theguardian.com/business/rss" },
    ],
    relevance: {
      include: [
        "market",
        "markets",
        "stock",
        "stocks",
        "shares",
        "wall street",
        "investor",
        "earnings",
        "inflation",
        "price",
        "prices",
        "fuel prices",
        "rates",
        "fed",
        "bond",
        "yield",
        "oil",
        "gold",
        "bitcoin",
        "crypto",
        "tariff",
      ],
      exclude: ["tv", "music", "film", "celebrity", "sports"],
      minimumScore: 3,
    },
  },
  {
    key: "world",
    label: "World",
    query: "world geopolitics",
    feeds: [
      { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
      { name: "The Guardian World", url: "https://www.theguardian.com/world/rss" },
    ],
    relevance: {
      include: [
        "world",
        "geopolitics",
        "government",
        "election",
        "war",
        "security",
        "trade",
        "china",
        "russia",
        "iran",
        "tariff",
        "sanction",
      ],
      minimumScore: 1,
    },
  },
  {
    key: "europe",
    label: "Europe",
    query: "Europe economy politics business",
    feeds: [
      { name: "BBC Europe", url: "https://feeds.bbci.co.uk/news/world/europe/rss.xml" },
      { name: "The Guardian Europe", url: "https://www.theguardian.com/world/europe-news/rss" },
    ],
    relevance: {
      include: [
        "europe",
        "eu",
        "eurozone",
        "brussels",
        "ukraine",
        "france",
        "germany",
        "italy",
        "spain",
        "portugal",
        "romania",
        "nato",
      ],
      minimumScore: 1,
    },
  },
  {
    key: "romania",
    label: "Romania",
    query: "Romania business economy technology politics",
    feeds: [{ name: "Romania Insider", url: "https://www.romania-insider.com/feed" }],
    relevance: {
      include: ["romania", "romanian", "bucharest", "cluj", "iasi", "brasov", "bvb", "cee"],
      minimumScore: 1,
      trustedFeedOnly: true,
    },
  },
];

const briefingFeeds = [
  ...sections.find((section) => section.key === "business").feeds,
  ...sections.find((section) => section.key === "tech").feeds,
  ...sections.find((section) => section.key === "markets").feeds,
  ...sections.find((section) => section.key === "world").feeds,
];

const topBriefingRelevance = {
  include: [
    "business",
    "company",
    "companies",
    "economy",
    "market",
    "markets",
    "stock",
    "stocks",
    "technology",
    "tech",
    "ai",
    "artificial intelligence",
    "geopolitics",
    "trade",
    "tariff",
    "inflation",
    "rates",
    "oil",
    "energy",
    "startup",
    "earnings",
    "ceo",
  ],
  exclude: [
    "celebrity",
    "entertainment",
    "fashion",
    "film",
    "football",
    "movie",
    "music",
    "recipe",
    "song",
    "sport",
    "sports",
    "tennis",
    "theatre",
    "travel",
    "tv",
  ],
  minimumScore: 1,
  minimumFallbackResults: 5,
};

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
    colors: ["#f6f1df", "#d8baa0", "#7d3f2f"],
    accent: "#ab5f2c",
    label: "Romania",
  },
  {
    match: /europe|eu\b|brussels|eurozone/i,
    colors: ["#eef3fa", "#c7d7ef", "#35507a"],
    accent: "#264b8f",
    label: "Europe",
  },
  {
    match: /market|stock|economy|fed|inflation|oil|gold|bitcoin|crypto/i,
    colors: ["#edf6f2", "#c9e0d7", "#0f3f37"],
    accent: "#0e6b58",
    label: "Markets",
  },
  {
    match: /tech|ai|artificial intelligence|startup|software|chip/i,
    colors: ["#eef2fb", "#cfdaf2", "#273d74"],
    accent: "#285f9f",
    label: "Tech",
  },
  {
    match: /world|geopolitics|china|iran|russia|war|defense/i,
    colors: ["#f8efe8", "#e5c9b8", "#5f2f24"],
    accent: "#8f4732",
    label: "World",
  },
  {
    match: /business|company|earnings|deal|ceo/i,
    colors: ["#f5f5ef", "#ddd8c8", "#34322c"],
    accent: "#5f5b48",
    label: "Business",
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

const requestTimeoutMs = 5000;
const requestRetryCount = 1;
const feedDiagnostics = new Map();
const marketDiagnostics = new Map();
const titleStopwords = new Set([
  "amid",
  "after",
  "and",
  "are",
  "as",
  "at",
  "but",
  "for",
  "from",
  "how",
  "its",
  "new",
  "not",
  "now",
  "off",
  "out",
  "says",
  "say",
  "the",
  "their",
  "this",
  "that",
  "what",
  "when",
  "with",
  "will",
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
  return decodeEntities(
    value
      .replace(/<!\[CDATA\[|\]\]>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeEntities(value = "") {
  return value
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_match, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function hashString(value = "") {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function cleanTitle(title = "") {
  return title.replace(/\s[-|]\s[^-|]+$/, "").trim() || title;
}

function recordDiagnostic(store, key, payload) {
  store.set(key, {
    ...(store.get(key) || {}),
    ...payload,
    checkedAt: new Date().toISOString(),
  });
}

function getDiagnosticSnapshot(store) {
  return [...store.entries()]
    .map(([key, value]) => ({
      key,
      ...value,
    }))
    .sort((first, second) => first.name.localeCompare(second.name));
}

function buildFeedUrl(topic) {
  if (!topic) {
    return "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en";
  }

  const query = encodeURIComponent(topic);
  return `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
}

function getVisualPreset(topic, title = "") {
  const haystack = `${topic} ${title}`;
  return (
    visualPresets.find((preset) => preset.match.test(haystack)) || {
      colors: ["#f3f5f0", "#dce2d9", "#38443f"],
      accent: "#0e6b58",
      label: "Signal",
    }
  );
}

function getToneKey(label = "Signal") {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "signal";
}

function getSourceInitials(source = "") {
  return (
    source
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "SL"
  );
}

function getThumbnailTopic(topic, title = "", source = "") {
  return topic === "business technology markets geopolitics" ? `${title} ${source}` : topic;
}

function getThumbnailMeta(topic, title = "", source = "") {
  const thumbnailTopic = getThumbnailTopic(topic, title, source);
  const preset = getVisualPreset(thumbnailTopic, title);
  const hash = hashString(`${topic}|${title}|${source}`);
  return {
    label: preset.label,
    tone: getToneKey(preset.label),
    initials: getSourceInitials(source || preset.label),
    variant: parseInt(hash.slice(0, 2), 36) % 5,
  };
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

function getTitleTokens(title = "") {
  return cleanTitle(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token && token.length > 2 && !titleStopwords.has(token));
}

function getEventKey(article) {
  const tokens = getTitleTokens(article.title || "");
  return tokens.slice(0, 5).join(" ") || article.storyId || getArticleId(article);
}

function getTokenOverlap(firstTitle = "", secondTitle = "") {
  const firstTokens = new Set(getTitleTokens(firstTitle));
  const secondTokens = new Set(getTitleTokens(secondTitle));

  if (!firstTokens.size || !secondTokens.size) {
    return 0;
  }

  let matches = 0;
  for (const token of firstTokens) {
    if (secondTokens.has(token)) {
      matches += 1;
    }
  }

  return matches / Math.max(1, Math.min(firstTokens.size, secondTokens.size));
}

function areArticlesSimilar(first, second) {
  if (!first || !second) {
    return false;
  }

  if (first.link && second.link && first.link === second.link) {
    return true;
  }

  if (getEventKey(first) === getEventKey(second)) {
    return true;
  }

  return getTokenOverlap(first.title, second.title) >= 0.6;
}

function scoreArticle(article) {
  const publishedAt = new Date(article.publishedAt).getTime();
  const ageHours = Number.isNaN(publishedAt) ? 72 : (Date.now() - publishedAt) / 36e5;
  const sourceBoost = trustedSourceBoosts.get(article.source) || 0;
  const recencyScore = Math.max(0, 72 - ageHours);
  const providerBoost = article.provider === "rss-direct" ? 8 : 0;

  return sourceBoost + recencyScore + providerBoost;
}

function getSearchRelevance(topic = "") {
  const normalized = topic.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const terms = normalized
    .replace(/\bor\b/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2 && !titleStopwords.has(term));

  if (normalized.includes("artificial intelligence")) {
    terms.push("ai");
  }

  return {
    include: [...new Set([normalized, ...terms])],
    minimumScore: 1,
  };
}

function escapeRegExp(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesRelevanceTerm(text, term) {
  const normalizedTerm = term.trim().toLowerCase();
  if (!normalizedTerm) {
    return false;
  }

  const pattern = normalizedTerm
    .split(/\s+/)
    .map((part) => escapeRegExp(part))
    .join("\\s+");
  return new RegExp(`(^|[^a-z0-9])${pattern}([^a-z0-9]|$)`, "i").test(text);
}

function getRelevanceScore(article, relevance) {
  if (!relevance) {
    return 0;
  }

  const title = cleanTitle(article.title || "").toLowerCase();
  const description = stripHtml(article.feedSnippet || article.description || "").toLowerCase();
  let score = 0;

  for (const term of relevance.include || []) {
    if (matchesRelevanceTerm(title, term)) {
      score += 3;
    } else if (matchesRelevanceTerm(description, term)) {
      score += 1;
    }
  }

  for (const term of relevance.exclude || []) {
    if (matchesRelevanceTerm(title, term) || matchesRelevanceTerm(description, term)) {
      score -= 3;
    }
  }

  if (relevance.trustedFeedOnly && article.provider === "rss-direct") {
    score += 1;
  }

  return score;
}

function rankArticle(article, relevance) {
  const relevanceBoost = Math.max(-3, getRelevanceScore(article, relevance)) * 12;
  return scoreArticle(article) + Math.min(6, Math.max(0, (article.clusterCount || 1) - 1)) * 6 + relevanceBoost;
}

function hasEnoughRelevantArticles(articles, relevance, limit) {
  if (!relevance) {
    return true;
  }

  const minimumScore = relevance.minimumScore ?? 1;
  const minimumCount = Math.min(limit, relevance.minimumResults || 3);
  return articles.filter((article) => getRelevanceScore(article, relevance) >= minimumScore).length >= minimumCount;
}

function getStoryAngle(article, fallbackTopic) {
  const text = `${article.title || ""} ${article.feedSnippet || article.description || ""}`.toLowerCase();

  if (/(stock|market|earnings|investor|rates|inflation|oil|gold|bitcoin|crypto)/.test(text)) {
    return "market positioning";
  }

  if (/(war|tariff|sanction|election|government|minister|regulation|geopolitic)/.test(text)) {
    return "policy and geopolitical risk";
  }

  if (/(ai|chip|software|startup|technology|app)/.test(text)) {
    return "technology adoption and capital allocation";
  }

  return `${fallbackTopic.toLowerCase()} agenda`;
}

function buildBriefSummary(article, fallbackTopic) {
  const text = `${article.title || ""} ${article.feedSnippet || article.description || ""} ${fallbackTopic}`.toLowerCase();
  const labels = [];

  const addLabel = (label) => {
    if (!labels.includes(label)) {
      labels.push(label);
    }
  };

  if (/(rate|fed|bond|yield|inflation)/.test(text)) {
    addLabel("Rates");
  }

  if (/(earning|revenue|profit|stock|share|wall street|market)/.test(text)) {
    addLabel("Markets");
  }

  if (/(oil|gas|energy|gold|bitcoin|crypto)/.test(text)) {
    addLabel("Commodities");
  }

  if (/(ai|artificial intelligence|chip|semiconductor|software|cloud)/.test(text)) {
    addLabel("AI and tech");
  }

  if (/(startup|funding|venture|ipo|acquire|deal|merger)/.test(text)) {
    addLabel("Deals");
  }

  if (/(tariff|trade|regulation|regulator|government|minister|election)/.test(text)) {
    addLabel("Policy");
  }

  if (/(war|security|nato|russia|china|iran|ukraine)/.test(text)) {
    addLabel("Geopolitics");
  }

  if (/(europe|eu\b|eurozone|brussels|romania|bucharest|cee)/.test(text)) {
    addLabel("Europe");
  }

  if (!labels.length) {
    addLabel(fallbackTopic.split(/\s+/).slice(0, 2).join(" ") || "Business");
  }

  return labels.slice(0, 2).join(" / ");
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
  const title = cleanTitle(decodeEntities(item.title || "Untitled article"));
  const storyId = hashString(`${link}|${source}|${title}`);
  const feedSnippet = stripHtml(rawDescription);

  const article = {
    storyId,
    title,
    link,
    publishedAt: item.pubDate || item.published || item.updated || "",
    source,
    sourceUrl,
    thumbnail: getThumbnailMeta(topic, title, source),
    clusterSources,
    clusterCount: clusterSources.length,
    description: "",
    feedSnippet,
    provider,
  };
  const briefSummary = buildBriefSummary(article, topic || "Top stories");

  return {
    ...article,
    description: briefSummary,
    briefSummary,
  };
}

async function fetchText(url, headers) {
  let lastError = new Error("Unknown request failure");

  for (let attempt = 0; attempt < requestRetryCount; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      lastError =
        error.name === "AbortError" ? new Error(`Request timed out after ${requestTimeoutMs}ms`) : error;

      if (attempt + 1 < requestRetryCount) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError;
}

async function fetchRss(url) {
  return parser.parse(
    await fetchText(url, {
      "Accept": "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
      "User-Agent": "Mozilla/5.0 KreativTools/1.0",
    }),
  );
}

function recordFeedSuccess(feed, provider, count, latencyMs) {
  recordDiagnostic(feedDiagnostics, feed.url, {
    name: feed.name,
    url: feed.url,
    provider,
    status: "ok",
    articleCount: count,
    latencyMs,
    lastSuccessAt: new Date().toISOString(),
    lastError: "",
  });
}

function recordFeedFailure(feed, provider, error) {
  recordDiagnostic(feedDiagnostics, feed.url, {
    name: feed.name,
    url: feed.url,
    provider,
    status: "error",
    articleCount: 0,
    lastFailureAt: new Date().toISOString(),
    lastError: error.message,
  });
}

async function fetchFeedArticles(feed, topic, limit = 12) {
  const startedAt = Date.now();

  try {
    const parsed = await fetchRss(feed.url);
    const channel = parsed?.rss?.channel || parsed?.feed;
    const articles = getItems(channel)
      .slice(0, Math.max(limit * 2, limit))
      .map((item) => buildArticle(item, topic, feed.name, "rss-direct"))
      .sort((first, second) => scoreArticle(second) - scoreArticle(first))
      .slice(0, limit);

    recordFeedSuccess(feed, "rss-direct", articles.length, Date.now() - startedAt);
    return articles;
  } catch (error) {
    recordFeedFailure(feed, "rss-direct", error);
    throw error;
  }
}

async function fetchGoogleNewsArticles(topic, limit = 12) {
  const feed = {
    name: "Google News fallback",
    url: buildFeedUrl(topic),
  };
  const startedAt = Date.now();

  try {
    const parsed = await fetchRss(feed.url);
    const channel = parsed?.rss?.channel;
    const articles = getItems(channel)
      .slice(0, Math.max(limit * 2, limit))
      .map((item) => buildArticle(item, topic, "Google News", "google-news"))
      .sort((first, second) => scoreArticle(second) - scoreArticle(first))
      .slice(0, limit);

    recordFeedSuccess(feed, "google-news", articles.length, Date.now() - startedAt);
    return articles;
  } catch (error) {
    recordFeedFailure(feed, "google-news", error);
    throw error;
  }
}

function dedupeArticles(articles, limit, relevance = null) {
  const groups = [];

  for (const article of articles.filter(Boolean).sort((first, second) => rankArticle(second, relevance) - rankArticle(first, relevance))) {
    const group = groups.find((candidate) => areArticlesSimilar(article, candidate.representative));

    if (!group) {
      groups.push({
        representative: article,
        articles: [article],
        sources: new Set([article.source, ...(article.clusterSources || [])].filter(Boolean)),
      });
      continue;
    }

    group.articles.push(article);
    for (const source of [article.source, ...(article.clusterSources || [])].filter(Boolean)) {
      group.sources.add(source);
    }
  }

  const rankedArticles = groups
    .map((group) => ({
      ...group.representative,
      clusterSources: [...group.sources],
      clusterCount: group.sources.size,
      clusterSize: group.articles.length,
    }))
    .sort((first, second) => rankArticle(second, relevance) - rankArticle(first, relevance));

  if (!relevance || relevance.strict === false) {
    return rankedArticles.slice(0, limit);
  }

  const minimumScore = relevance.minimumScore ?? 1;
  const relevantArticles = rankedArticles.filter((article) => getRelevanceScore(article, relevance) >= minimumScore);

  if (relevantArticles.length > 0) {
    return relevantArticles.slice(0, limit);
  }

  return rankedArticles.slice(0, Math.min(limit, relevance.minimumFallbackResults || 3));
}

async function fetchArticles(topic, limit = 12, feeds = [], options = {}) {
  const relevance = Object.prototype.hasOwnProperty.call(options, "relevance") ? options.relevance : getSearchRelevance(topic);
  const directResults = await Promise.allSettled(feeds.map((feed) => fetchFeedArticles(feed, topic, limit)));
  const directArticles = directResults
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value);

  if (directArticles.length >= limit) {
    const directRanked = dedupeArticles(directArticles, limit, relevance);
    if (hasEnoughRelevantArticles(directRanked, relevance, limit)) {
      return directRanked;
    }
  }

  try {
    const googleArticles = await fetchGoogleNewsArticles(topic, Math.max(limit, limit * 2));
    return dedupeArticles([...directArticles, ...googleArticles], limit, relevance);
  } catch {
    return dedupeArticles(directArticles, limit, relevance);
  }
}

function toPublicArticle(article) {
  return {
    storyId: article.storyId,
    title: article.title,
    link: article.link,
    publishedAt: article.publishedAt,
    source: article.source,
    description: article.briefSummary || article.description || "",
    thumbnail: article.thumbnail,
  };
}

function joinPlainList(items = []) {
  if (items.length <= 1) {
    return items[0] || "";
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function sentenceCase(value = "") {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
}

function countSectionArticles(sectionData, key) {
  return sectionData.find((section) => section.key === key)?.articles.length || 0;
}

function buildEditorialBrief(topStories = [], sectionData = []) {
  const storyText = topStories
    .map((article) => `${article.title || ""} ${article.feedSnippet || ""} ${article.briefSummary || ""}`)
    .join(" ");
  const focusAreas = [];
  const signals = [];

  if (/(stock|market|earnings|investor|rates|inflation|oil|gold|bitcoin|crypto)/i.test(storyText) || countSectionArticles(sectionData, "markets") >= 3) {
    focusAreas.push("markets");
    signals.push("Markets: prices, rates, earnings.");
  }

  if (/(ai|chip|software|startup|technology|app|semiconductor)/i.test(storyText) || countSectionArticles(sectionData, "tech") >= 3) {
    focusAreas.push("technology");
    signals.push("Technology: adoption, chips, funding.");
  }

  if (/(war|tariff|sanction|election|government|minister|trade|geopolitic)/i.test(storyText) || countSectionArticles(sectionData, "world") >= 3) {
    focusAreas.push("policy risk");
    signals.push("Policy: trade, security, regulation.");
  }

  if (countSectionArticles(sectionData, "europe") || countSectionArticles(sectionData, "romania")) {
    focusAreas.push("regional coverage");
    signals.push("Europe and Romania: companies, policy, capital.");
  }

  if (signals.length < 4) {
    signals.push("Open only the items that affect your work.");
  }

  const focusSummary = focusAreas.length ? joinPlainList([...new Set(focusAreas)].slice(0, 4)) : "business signal";

  return {
    title: "What to scan first",
    summary: `${sentenceCase(focusSummary)} lead today's read. Start with the lead story, then open the items that affect your work.`,
    signals: signals.slice(0, 4),
  };
}

async function buildBriefing(env) {
  const [topStories, ...sectionFeeds] = await Promise.all([
    fetchArticles("business technology markets geopolitics", 10, briefingFeeds, {
      relevance: {
        ...topBriefingRelevance,
        strict: false,
      },
    }),
    ...sections.map((section) => fetchArticles(section.query, 8, section.feeds, { relevance: section.relevance })),
  ]);

  const seen = new Set(topStories.map(getEventKey));
  const sectionData = sections.map((section, index) => {
    const articles = sectionFeeds[index].filter((article) => {
      const id = getEventKey(article);
      if (seen.has(id)) {
        return false;
      }

      seen.add(id);
      return true;
    });

    return {
      key: section.key,
      label: section.label,
      articles: articles.map(toPublicArticle),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    editorialBrief: buildEditorialBrief(topStories, sectionData),
    lead: topStories[0] ? toPublicArticle(topStories[0]) : null,
    fastBriefing: topStories.slice(1, 9).map(toPublicArticle),
    markets: getFallbackMarketSnapshot(),
    sections: sectionData,
  };
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
  const startedAt = Date.now();
  const attempts = await Promise.allSettled(
    market.symbols.map(async (symbol) => {
      const symbolParam = symbol.startsWith("%") ? symbol : encodeURIComponent(symbol);
      const url = `https://stooq.com/q/l/?s=${symbolParam}&f=sd2t2ohlcvn&h&e=csv`;

      const csv = await fetchText(url, {
        "Accept": "text/csv,*/*",
        "User-Agent": "Mozilla/5.0 KreativTools/1.0",
      });
      return {
        symbol,
        parsed: parseMarketCsv(csv, market),
      };
    }),
  );

  const success = attempts.find((result) => result.status === "fulfilled");
  if (success) {
    recordDiagnostic(marketDiagnostics, market.key, {
      name: market.label,
      symbol: success.value.symbol,
      provider: "stooq",
      status: "ok",
      latencyMs: Date.now() - startedAt,
      lastSuccessAt: new Date().toISOString(),
      lastError: "",
    });
    return success.value.parsed;
  }

  const errors = attempts.map((result, index) => `${market.symbols[index]}: ${result.reason.message}`);
  recordDiagnostic(marketDiagnostics, market.key, {
    name: market.label,
    provider: "stooq",
    status: "error",
    lastFailureAt: new Date().toISOString(),
    lastError: errors.join("; ") || `No market data for ${market.key}`,
  });
  throw new Error(errors.join("; ") || `No market data for ${market.key}`);
}

async function fetchMarkets() {
  const results = await Promise.allSettled(marketSymbols.map((market) => fetchMarket(market)));
  const markets = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.warn(`Skipping ${marketSymbols[index].label}: ${result.reason.message}`);
    }
  });

  if (markets.length === marketSymbols.length) {
    return markets;
  }

  const liveKeys = new Set(markets.map((market) => market.key));
  return [
    ...markets,
    ...getFallbackMarketSnapshot().filter((market) => !liveKeys.has(market.key)),
  ];
}

function getFallbackMarketSnapshot() {
  const fallbackUpdatedAt = new Date().toISOString();
  return fallbackMarkets.map((market) => ({
    ...market,
    updatedAt: fallbackUpdatedAt,
    isFallback: true,
    provider: "fallback-snapshot",
  }));
}

const publicTopics = [
  { topic: "artificial intelligence", sectionKey: "tech", aliases: ["ai", "artificial intelligence"] },
  { topic: "markets", sectionKey: "markets", aliases: ["markets"] },
  { topic: "romania", sectionKey: "romania", aliases: ["romania"] },
  { topic: "europe", sectionKey: "europe", aliases: ["europe"] },
];
const publicTopicSections = new Map(
  publicTopics.flatMap((topicConfig) => topicConfig.aliases.map((alias) => [alias, topicConfig])),
);

function normalizeTopicKey(topic = "") {
  return topic.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

function findPublicTopic(topic = "") {
  const topicConfig = publicTopicSections.get(normalizeTopicKey(topic));
  if (!topicConfig) {
    return null;
  }

  const section = sections.find((item) => item.key === topicConfig.sectionKey);
  return section ? { ...topicConfig, section } : null;
}

function getConfiguredFeeds() {
  const uniqueFeeds = new Map();

  for (const feed of [...briefingFeeds, ...sections.flatMap((section) => section.feeds)]) {
    if (!uniqueFeeds.has(feed.url)) {
      uniqueFeeds.set(feed.url, feed);
    }
  }

  return [...uniqueFeeds.values()].map((feed) => ({
    name: feed.name,
    url: feed.url,
    provider: "rss-direct",
    status: "pending",
    ...(feedDiagnostics.get(feed.url) || {}),
  }));
}

function getReadiness() {
  return [
    {
      name: "Reader flow",
      status: "ready",
      detail: "Briefing cards stay short and link readers to the original publisher.",
    },
    {
      name: "Fixed topics",
      status: "ready",
      detail: "Public topic pages are limited to AI, markets, Europe, and Romania instead of open-ended generated searches.",
    },
    {
      name: "Market data",
      status: "advisory",
      detail: "Market cards use live provider data with fallback snapshots when the provider is unavailable.",
    },
  ];
}

function getHealthReport() {
  const googleFallback = getDiagnosticSnapshot(feedDiagnostics).filter((entry) => entry.provider === "google-news");

  return {
    generatedAt: new Date().toISOString(),
    readiness: getReadiness(),
    feeds: [...getConfiguredFeeds(), ...googleFallback],
    markets: getDiagnosticSnapshot(marketDiagnostics),
  };
}

async function handleApi(request, env, ctx) {
  const url = new URL(request.url);

  try {
    if (url.pathname === "/api/briefing") {
      return cachedJson(request, ctx, 600, () => buildBriefing(env));
    }

    if (url.pathname === "/api/markets") {
      return cachedJson(request, ctx, 60, async () => ({
        generatedAt: new Date().toISOString(),
        markets: await fetchMarkets(),
      }));
    }

    if (url.pathname === "/api/health") {
      return jsonResponse(getHealthReport(), 200, 30);
    }

    if (url.pathname === "/api/news") {
      const topic = url.searchParams.get("topic")?.trim() || "";
      const publicTopic = findPublicTopic(topic);

      if (!publicTopic) {
        return jsonResponse(
          {
            error: "Topic not available.",
            availableTopics: publicTopics.map((item) => item.topic),
          },
          404,
        );
      }

      return cachedJson(request, ctx, 600, async () => {
        const articles = await fetchArticles(publicTopic.topic, 12, publicTopic.section.feeds, {
          relevance: publicTopic.section.relevance,
        });

        return {
          topic: publicTopic.topic,
          articles: articles.map(toPublicArticle),
        };
      });
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
      return handleApi(request, env, ctx);
    }

    if (url.pathname === "/briefing/today" || url.pathname.startsWith("/story/")) {
      return Response.redirect(new URL("/", url), 301);
    }

    if (
      url.pathname.startsWith("/topic/") ||
      ["/about", "/privacy", "/terms", "/contact"].includes(url.pathname)
    ) {
      const indexUrl = new URL("/", url);
      return env.ASSETS.fetch(new Request(indexUrl, request));
    }

    return env.ASSETS.fetch(request);
  },
};
