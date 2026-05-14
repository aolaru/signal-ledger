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
const feedDiagnostics = new Map();
const marketDiagnostics = new Map();
const newsCacheMs = 10 * 60 * 1000;
const marketCacheMs = 60 * 1000;
const requestTimeoutMs = 8000;
const requestRetryCount = 2;
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
  "say",
  "says",
  "that",
  "the",
  "their",
  "this",
  "what",
  "when",
  "will",
  "with",
]);

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

function getStoryPath(story) {
  return `/story/${encodeURIComponent(story.storyId)}/${story.storySlug || slugify(story.title || story.storyId)}`;
}

function withStoryMeta(story, storyStored) {
  return {
    ...story,
    storyStored,
    storySlug: story.storySlug || slugify(story.title || story.storyId),
    canonicalPath: getStoryPath(story),
  };
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

function escapeXml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
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

function getSourceBadgeUrl(source = "") {
  const normalized = source.trim() || "SL";
  const initials = normalized
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "SL";
  const hash = hashString(normalized);
  const hue = parseInt(hash.slice(0, 3), 36) % 360;
  const background = `hsl(${hue} 45% 92%)`;
  const border = `hsl(${hue} 38% 74%)`;
  const text = `hsl(${hue} 52% 26%)`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="26" fill="${background}"/><rect x="8" y="8" width="112" height="112" rx="22" fill="none" stroke="${border}" stroke-width="6"/><text x="64" y="76" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" font-weight="700" fill="${text}">${escapeXml(initials)}</text></svg>`;
  return svgToDataUrl(svg);
}

function getVisualUrl(topic, title = "") {
  const preset = getVisualPreset(topic, title);
  const titleLabel = escapeXml(cleanTitle(title).slice(0, 66) || preset.label);
  const sectionLabel = escapeXml(preset.label);
  const [background, panel, ink] = preset.colors;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" viewBox="0 0 900 540"><rect width="900" height="540" fill="${background}"/><rect x="44" y="44" width="812" height="452" rx="30" fill="${panel}"/><path d="M76 392C170 330 240 362 338 268s176-120 280-76 142 32 206-24" fill="none" stroke="${preset.accent}" stroke-width="12" stroke-linecap="round"/><path d="M104 420L180 342 250 374 336 278 418 306 506 218 612 248 724 176" fill="none" stroke="${ink}" stroke-opacity="0.45" stroke-width="8" stroke-linecap="round"/><g fill="${ink}" fill-opacity="0.12"><rect x="112" y="244" width="54" height="176" rx="8"/><rect x="188" y="288" width="54" height="132" rx="8"/><rect x="264" y="226" width="54" height="194" rx="8"/><rect x="340" y="316" width="54" height="104" rx="8"/><rect x="416" y="266" width="54" height="154" rx="8"/></g><text x="88" y="122" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="${ink}" fill-opacity="0.72">${sectionLabel}</text><text x="88" y="188" font-family="Georgia, serif" font-size="48" font-weight="700" fill="${ink}">${titleLabel}</text></svg>`;
  return svgToDataUrl(svg);
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

function rankArticle(article) {
  return scoreArticle(article) + Math.min(6, Math.max(0, (article.clusterCount || 1) - 1)) * 6;
}

function buildWatchPointText(article) {
  const text = `${article.title || ""} ${article.description || ""}`.toLowerCase();

  if (/(stock|market|earnings|investor|rates|inflation|oil|gold|bitcoin|crypto)/.test(text)) {
    return "Watch whether the story changes pricing, investor positioning, or expectations in the next market session.";
  }

  if (/(war|tariff|sanction|election|government|minister|regulation)/.test(text)) {
    return "Watch for policy responses, official statements, and second-order effects for companies exposed to the region.";
  }

  if (/(ai|chip|software|startup|technology|app)/.test(text)) {
    return "Watch for product, regulatory, or capital-allocation signals that show whether this becomes a durable technology trend.";
  }

  return "Watch whether other credible sources confirm the direction and whether the story develops beyond the first headline.";
}

function getStoryAngle(article, fallbackTopic) {
  const text = `${article.title || ""} ${article.description || ""}`.toLowerCase();

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

function getWhyItMatters(article, fallbackTopic) {
  const cleanDescription = stripHtml(article.description || "");
  const firstSentence = cleanDescription.split(/(?<=[.!?])\s+/)[0];

  if (firstSentence && firstSentence.length > 45) {
    return firstSentence.length > 180 ? `${firstSentence.slice(0, 177)}...` : firstSentence;
  }

  return `This is moving the ${fallbackTopic.toLowerCase()} conversation and is worth tracking today.`;
}

function buildBriefSummary(article, fallbackTopic) {
  const angle = getStoryAngle(article, fallbackTopic);
  return `${article.source || "The source"} frames this as a ${angle} story. ${getWhyItMatters(article, fallbackTopic)}`;
}

function buildSourceContext(article) {
  if (article.clusterCount > 1 && article.clusterSources?.length) {
    return `${article.clusterCount} sources in the current briefing snapshot are tracking this story: ${article.clusterSources
      .slice(0, 4)
      .join(", ")}.`;
  }

  return `${article.source || "The source"} is the primary source surfaced in the current briefing snapshot.`;
}

function buildKeyPoints(article, fallbackTopic) {
  const description = stripHtml(article.description || "");
  const firstPoint = description.length > 170 ? `${description.slice(0, 167)}...` : description;
  return [
    firstPoint || `What happened: ${cleanTitle(article.title || "This story is developing")}.`,
    `Why it matters: ${getWhyItMatters(article, fallbackTopic)}`,
    `What to watch: ${buildWatchPointText(article)}`,
  ];
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
    canonicalPath: getStoryPath({ storyId, storySlug: slugify(title), title }),
    title,
    link,
    publishedAt: item.pubDate || item.published || item.updated || "",
    source,
    sourceUrl,
    imageUrl: getSourceBadgeUrl(source),
    visualUrl: getVisualUrl(topic, title),
    clusterSources,
    clusterCount: clusterSources.length,
    description: stripHtml(rawDescription),
    provider,
  };

  return {
    ...article,
    whyItMatters: getWhyItMatters(article, topic || "Top stories"),
    briefSummary: buildBriefSummary(article, topic || "Top stories"),
    watchPoint: buildWatchPointText(article),
    sourceContext: buildSourceContext(article),
    keyPoints: buildKeyPoints(article, topic || "Top stories"),
    angle: getStoryAngle(article, topic || "Top stories"),
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
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
      "User-Agent": "Mozilla/5.0 SignalLedger/1.0",
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

function dedupeArticles(articles, limit) {
  const groups = [];

  for (const article of articles.filter(Boolean).sort((first, second) => scoreArticle(second) - scoreArticle(first))) {
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

  return groups
    .map((group) =>
      withStoryMeta(
        {
          ...group.representative,
          clusterSources: [...group.sources],
          clusterCount: group.sources.size,
          clusterSize: group.articles.length,
        },
        group.representative.storyStored,
      ),
    )
    .sort((first, second) => rankArticle(second) - rankArticle(first))
    .slice(0, limit);
}

function persistStories(stories) {
  for (const story of stories) {
    storyStore.set(story.storyId, withStoryMeta(story, true));
  }

  return stories.map((story) => withStoryMeta(story, true));
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
  const startedAt = Date.now();

  for (const symbol of market.symbols) {
    const symbolParam = symbol.startsWith("%") ? symbol : encodeURIComponent(symbol);
    const url = `https://stooq.com/q/l/?s=${symbolParam}&f=sd2t2ohlcvn&h&e=csv`;

    try {
      const csv = await fetchText(url, {
        Accept: "text/csv,*/*",
        "User-Agent": "Mozilla/5.0 SignalLedger/1.0",
      });
      const data = parseMarketCsv(csv, market);
      recordDiagnostic(marketDiagnostics, market.key, {
        name: market.label,
        symbol,
        provider: "stooq",
        status: "ok",
        latencyMs: Date.now() - startedAt,
        lastSuccessAt: new Date().toISOString(),
        lastError: "",
      });
      writeCache(marketCache, market.key, data, marketCacheMs);
      return data;
    } catch (error) {
      errors.push(`${symbol}: ${error.message}`);
    }
  }

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

function getActiveNewsletterProvider() {
  if (process.env.BUTTONDOWN_API_KEY) {
    return "buttondown";
  }

  if (process.env.KIT_API_KEY) {
    return "kit";
  }

  if (process.env.NEWSLETTER_WEBHOOK_URL) {
    return "webhook";
  }

  return "local-prototype";
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
      name: "Story storage",
      status: "advisory",
      detail: "Local server stores story pages in memory. Cloudflare KV is still the production target.",
    },
    {
      name: "Newsletter provider",
      status: getActiveNewsletterProvider() === "local-prototype" ? "action-needed" : "ready",
      detail:
        getActiveNewsletterProvider() === "local-prototype"
          ? "Configure Buttondown, Kit, or a newsletter webhook before launch."
          : `Newsletter signups are forwarded to ${getActiveNewsletterProvider()}.`,
    },
    {
      name: "Signup storage",
      status: "advisory",
      detail: "Local server keeps newsletter state in-process only. Cloudflare KV remains the recommended backup store.",
    },
  ];
}

function getHealthReport() {
  const googleFallback = getDiagnosticSnapshot(feedDiagnostics).filter((entry) => entry.provider === "google-news");

  return {
    generatedAt: new Date().toISOString(),
    storyStorage: {
      provider: "in-memory",
      configured: true,
    },
    newsletter: {
      provider: getActiveNewsletterProvider(),
      signupStorage: "local-process",
    },
    readiness: getReadiness(),
    feeds: [...getConfiguredFeeds(), ...googleFallback],
    markets: getDiagnosticSnapshot(marketDiagnostics),
  };
}

app.use(express.static(path.join(__dirname, "public")));

app.get(/^\/topic\/.+/, (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get(/^\/story\/.+/, (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get(["/about", "/ops", "/briefing/today"], (_req, res) => {
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

app.get("/api/health", (_req, res) => {
  res.json(getHealthReport());
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
          ? "Signup saved locally. Configure a newsletter provider to send subscribers to a real list."
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
