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

const storyStorageTtlSeconds = 60 * 60 * 24 * 30;
const requestTimeoutMs = 8000;
const requestRetryCount = 2;
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

function getSourceBadgeUrl(source = "") {
  const normalized = source.trim() || "SL";
  const initials = getSourceInitials(normalized);
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

function getThumbnailMotif(variant, preset, ink, seed) {
  const offset = seed % 28;

  if (variant === 0) {
    return `<circle cx="${238 - offset}" cy="78" r="38" fill="${preset.accent}" fill-opacity="0.18"/><path d="M52 228C88 188 120 206 154 162s72-58 112-34" fill="none" stroke="${preset.accent}" stroke-width="12" stroke-linecap="round"/><path d="M58 246L96 204 130 218 164 170 204 188 256 132" fill="none" stroke="${ink}" stroke-opacity="0.48" stroke-width="7" stroke-linecap="round"/><g fill="${ink}" fill-opacity="0.11"><rect x="62" y="184" width="24" height="64" rx="6"/><rect x="98" y="204" width="24" height="44" rx="6"/><rect x="134" y="166" width="24" height="82" rx="6"/></g>`;
  }

  if (variant === 1) {
    return `<circle cx="108" cy="206" r="${68 + offset / 2}" fill="none" stroke="${preset.accent}" stroke-width="12" stroke-opacity="0.34"/><circle cx="108" cy="206" r="${34 + offset / 3}" fill="${preset.accent}" fill-opacity="0.16"/><circle cx="228" cy="96" r="44" fill="${ink}" fill-opacity="0.1"/><path d="M72 88h164M72 116h96M72 144h130" stroke="${ink}" stroke-width="9" stroke-linecap="round" stroke-opacity="0.24"/>`;
  }

  if (variant === 2) {
    return `<path d="M22 248L298 86V298H22Z" fill="${preset.accent}" fill-opacity="0.18"/><path d="M54 236L134 160L178 186L264 98" fill="none" stroke="${ink}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.5"/><path d="M246 98h20v20" fill="none" stroke="${ink}" stroke-width="10" stroke-linecap="round" stroke-opacity="0.5"/><rect x="58" y="70" width="86" height="12" rx="6" fill="${preset.accent}" fill-opacity="0.45"/><rect x="58" y="94" width="132" height="12" rx="6" fill="${ink}" fill-opacity="0.14"/>`;
  }

  if (variant === 3) {
    return `<g transform="translate(54 76)" fill="${preset.accent}" fill-opacity="0.2"><rect width="54" height="54" rx="12"/><rect x="66" width="54" height="54" rx="12" fill="${ink}" fill-opacity="0.16"/><rect x="132" width="54" height="54" rx="12"/><rect y="66" width="54" height="54" rx="12" fill="${ink}" fill-opacity="0.12"/><rect x="66" y="66" width="54" height="54" rx="12"/><rect x="132" y="66" width="54" height="54" rx="12" fill="${ink}" fill-opacity="0.2"/></g><path d="M58 238h198" stroke="${ink}" stroke-width="9" stroke-linecap="round" stroke-opacity="0.22"/><path d="M58 260h126" stroke="${preset.accent}" stroke-width="9" stroke-linecap="round" stroke-opacity="0.42"/>`;
  }

  if (variant === 4) {
    return `<path d="M72 224V104h58v48h70V88h48" fill="none" stroke="${ink}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.38"/><g fill="${preset.accent}" fill-opacity="0.58"><circle cx="72" cy="224" r="14"/><circle cx="130" cy="104" r="14"/><circle cx="200" cy="152" r="14"/><circle cx="248" cy="88" r="14"/></g><circle cx="114" cy="196" r="62" fill="${preset.accent}" fill-opacity="0.1"/><rect x="176" y="210" width="70" height="42" rx="12" fill="${ink}" fill-opacity="0.1"/>`;
  }

  return `<g fill="${ink}" fill-opacity="0.12"><rect x="58" y="${132 - offset / 3}" width="34" height="${118 + offset}" rx="8"/><rect x="106" y="${96 + offset / 4}" width="34" height="${154 - offset}" rx="8"/><rect x="154" y="${120 - offset / 5}" width="34" height="${130 + offset / 2}" rx="8"/><rect x="202" y="${82 + offset / 2}" width="34" height="${168 - offset / 2}" rx="8"/></g><path d="M52 250h216" stroke="${ink}" stroke-width="8" stroke-linecap="round" stroke-opacity="0.2"/><circle cx="236" cy="76" r="42" fill="${preset.accent}" fill-opacity="0.2"/><path d="M66 82h104" stroke="${preset.accent}" stroke-width="10" stroke-linecap="round" stroke-opacity="0.42"/>`;
}

function getThumbnailFallbackUrl(topic, title = "", source = "") {
  const preset = getVisualPreset(topic, title);
  const [background, panel, ink] = preset.colors;
  const sectionLabel = escapeXml(preset.label);
  const initials = escapeXml(getSourceInitials(source || preset.label));
  const hash = hashString(`${topic}|${title}|${source}`);
  const variant = parseInt(hash.slice(0, 2), 36) % 6;
  const seed = parseInt(hash.slice(2, 6), 36) || 0;
  const motif = getThumbnailMotif(variant, preset, ink, seed);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><rect width="320" height="320" fill="${background}"/><rect x="22" y="22" width="276" height="276" rx="26" fill="${panel}"/><rect x="22" y="22" width="276" height="276" rx="26" fill="none" stroke="${ink}" stroke-opacity="0.08" stroke-width="2"/>${motif}<text x="42" y="64" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="${ink}" fill-opacity="0.72">${sectionLabel}</text><text x="160" y="174" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="800" fill="${ink}" fill-opacity="0.76">${initials}</text></svg>`;
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

function buildWatchPointText(article) {
  const text = `${article.title || ""} ${article.feedSnippet || article.description || ""}`.toLowerCase();

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

function getWhyItMatters(article, fallbackTopic) {
  const title = cleanTitle(article.title || "This story");
  const angle = getStoryAngle(article, fallbackTopic);

  if (angle === "market positioning") {
    return `${title} matters as a market-positioning signal: it may shift investor expectations, sector pricing, or risk appetite in the next trading cycle.`;
  }

  if (angle === "policy and geopolitical risk") {
    return `${title} matters because policy and geopolitical decisions can quickly change company exposure, supply chains, and capital flows.`;
  }

  if (angle === "technology adoption and capital allocation") {
    return `${title} matters because technology adoption is increasingly tied to regulation, competitive positioning, and capital allocation.`;
  }

  return `${title} matters because it adds a fresh signal to the ${fallbackTopic.toLowerCase()} agenda for business readers.`;
}

function buildBriefSummary(article, fallbackTopic) {
  return getWhyItMatters(article, fallbackTopic);
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
  const angle = getStoryAngle(article, fallbackTopic);
  return [
    `Why it matters: This is a ${angle} story for business readers.`,
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
  const title = cleanTitle(decodeEntities(item.title || "Untitled article"));
  const storyId = hashString(`${link}|${source}|${title}`);
  const visualUrl = getVisualUrl(topic, title);
  const thumbnailFallbackUrl = getThumbnailFallbackUrl(topic, title, source);
  const feedSnippet = stripHtml(rawDescription);

  const article = {
    storyId,
    storySlug: slugify(title),
    storyStored: false,
    canonicalPath: getStoryPath({ storyId, storySlug: slugify(title), title }),
    title,
    link,
    publishedAt: item.pubDate || item.published || item.updated || "",
    source,
    sourceUrl,
    imageUrl: getSourceBadgeUrl(source),
    thumbnailUrl: thumbnailFallbackUrl,
    visualUrl,
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
    whyItMatters: getWhyItMatters(article, topic || "Top stories"),
    briefSummary,
    watchPoint: buildWatchPointText(article),
    sourceContext: buildSourceContext(article),
    keyPoints: buildKeyPoints(article, topic || "Top stories"),
    angle: getStoryAngle(article, topic || "Top stories"),
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

  const googleArticles = await fetchGoogleNewsArticles(topic, Math.max(limit, limit * 2));
  return dedupeArticles([...directArticles, ...googleArticles], limit, relevance);
}

function toPublicStory(story) {
  const { feedSnippet, ...publicStory } = story;
  return publicStory;
}

async function persistStories(env, stories) {
  if (!env.STORY_BRIEFS) {
    return stories.map((story) => withStoryMeta(toPublicStory(story), false));
  }

  const storedAt = new Date().toISOString();
  const storedStories = stories.map((story) => ({
    ...withStoryMeta(toPublicStory(story), true),
    storedAt,
  }));

  await Promise.all(
    storedStories.map((story) =>
      env.STORY_BRIEFS.put(`story:${story.storyId}`, JSON.stringify(story), {
        expirationTtl: storyStorageTtlSeconds,
      }),
    ),
  );

  return storedStories;
}

function collectStories(briefing) {
  return dedupeArticles(
    [briefing.lead, ...briefing.fastBriefing, ...briefing.sections.flatMap((section) => section.articles)].filter(Boolean),
    100,
  );
}

async function hydrateStoryStorage(env, briefing) {
  const storedStories = await persistStories(env, collectStories(briefing));
  const storyMap = new Map(storedStories.map((story) => [story.storyId, story]));

  return {
    ...briefing,
    lead: storyMap.get(briefing.lead.storyId),
    fastBriefing: briefing.fastBriefing.map((story) => storyMap.get(story.storyId) || story),
    sections: briefing.sections.map((section) => ({
      ...section,
      articles: section.articles.map((story) => storyMap.get(story.storyId) || story),
    })),
  };
}

async function buildBriefing(env) {
  const [topStories, markets, ...sectionFeeds] = await Promise.all([
    fetchArticles("business technology markets geopolitics", 10, briefingFeeds, {
      relevance: {
        ...topBriefingRelevance,
        strict: false,
      },
    }),
    fetchMarkets(),
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
      articles,
    };
  });

  return hydrateStoryStorage(env, {
    generatedAt: new Date().toISOString(),
    lead: topStories[0],
    fastBriefing: topStories.slice(1, 9),
    markets,
    sections: sectionData,
  });
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
  const errors = [];
  const startedAt = Date.now();

  for (const symbol of market.symbols) {
    const symbolParam = symbol.startsWith("%") ? symbol : encodeURIComponent(symbol);
    const url = `https://stooq.com/q/l/?s=${symbolParam}&f=sd2t2ohlcvn&h&e=csv`;

    try {
      const csv = await fetchText(url, {
        "Accept": "text/csv,*/*",
        "User-Agent": "Mozilla/5.0 SignalLedger/1.0",
      });
      const parsed = parseMarketCsv(csv, market);
      recordDiagnostic(marketDiagnostics, market.key, {
        name: market.label,
        symbol,
        provider: "stooq",
        status: "ok",
        latencyMs: Date.now() - startedAt,
        lastSuccessAt: new Date().toISOString(),
        lastError: "",
      });
      return parsed;
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

async function subscribeWithButtondown(env, email, request) {
  const response = await fetch("https://api.buttondown.com/v1/subscribers", {
    method: "POST",
    headers: {
      Authorization: `Token ${env.BUTTONDOWN_API_KEY}`,
      "Content-Type": "application/json",
      "X-Buttondown-Collision-Behavior": "add",
    },
    body: JSON.stringify({
      email_address: email,
      type: "regular",
      tags: ["signalledger"],
      notes: "Subscribed from SignalLedger website",
      ip_address: request.headers.get("CF-Connecting-IP") || "",
    }),
  });

  if (!response.ok && response.status !== 409) {
    const text = await response.text();
    throw new Error(`Buttondown subscribe failed: ${response.status} ${text.slice(0, 120)}`);
  }

  return "buttondown";
}

async function subscribeWithKit(env, email) {
  const response = await fetch("https://api.kit.com/v4/subscribers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Kit-Api-Key": env.KIT_API_KEY,
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

async function subscribeWithWebhook(env, email, request) {
  const response = await fetch(env.NEWSLETTER_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      source: "signalledger-web",
      createdAt: new Date().toISOString(),
      userAgent: request.headers.get("User-Agent") || "",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Newsletter webhook failed: ${response.status} ${text.slice(0, 120)}`);
  }

  return "webhook";
}

async function storeNewsletterSignup(env, email, request) {
  const signup = {
    email,
    createdAt: new Date().toISOString(),
    source: "signalledger-web",
    userAgent: request.headers.get("User-Agent") || "",
  };

  let provider = "local-prototype";

  if (env.BUTTONDOWN_API_KEY) {
    provider = await subscribeWithButtondown(env, email, request);
  } else if (env.KIT_API_KEY) {
    provider = await subscribeWithKit(env, email);
  } else if (env.NEWSLETTER_WEBHOOK_URL) {
    provider = await subscribeWithWebhook(env, email, request);
  }

  if (!env.NEWSLETTER_SIGNUPS) {
    return {
      stored: false,
      storage: "local-prototype",
      provider,
    };
  }

  await env.NEWSLETTER_SIGNUPS.put(`signup:${email.toLowerCase()}`, JSON.stringify(signup));
  return {
    stored: true,
    storage: "cloudflare-kv",
    provider,
  };
}

async function loadStoredStory(env, storyId) {
  if (!storyId) {
    throw new Error("Missing story id");
  }

  if (!env.STORY_BRIEFS) {
    return null;
  }

  const stored = await env.STORY_BRIEFS.get(`story:${storyId}`);
  return stored ? JSON.parse(stored) : null;
}

function findSection(topic = "") {
  const normalized = topic.trim().toLowerCase();
  return sections.find((section) => {
    const label = section.label.toLowerCase();
    return normalized === section.key || normalized === label || normalized.includes(section.key);
  });
}

function findSectionFeeds(topic = "") {
  return findSection(topic)?.feeds;
}

function getActiveNewsletterProvider(env) {
  if (env.BUTTONDOWN_API_KEY) {
    return "buttondown";
  }

  if (env.KIT_API_KEY) {
    return "kit";
  }

  if (env.NEWSLETTER_WEBHOOK_URL) {
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

function getReadiness(env) {
  return [
    {
      name: "Story storage",
      status: env.STORY_BRIEFS ? "ready" : "action-needed",
      detail: env.STORY_BRIEFS
        ? "Cloudflare KV is configured for permanent story pages."
        : "Configure STORY_BRIEFS KV to move story pages fully off URL-encoded fallback links.",
    },
    {
      name: "Newsletter provider",
      status: getActiveNewsletterProvider(env) === "local-prototype" ? "action-needed" : "ready",
      detail:
        getActiveNewsletterProvider(env) === "local-prototype"
          ? "Configure Buttondown, Kit, or a newsletter webhook before launch."
          : `Newsletter signups are forwarded to ${getActiveNewsletterProvider(env)}.`,
    },
    {
      name: "Signup storage",
      status: env.NEWSLETTER_SIGNUPS ? "ready" : "advisory",
      detail: env.NEWSLETTER_SIGNUPS
        ? "Newsletter signups are also stored in Cloudflare KV."
        : "NEWSLETTER_SIGNUPS KV is optional but recommended for audit and backup.",
    },
  ];
}

function getHealthReport(env) {
  const googleFallback = getDiagnosticSnapshot(feedDiagnostics).filter((entry) => entry.provider === "google-news");

  return {
    generatedAt: new Date().toISOString(),
    storyStorage: {
      provider: env.STORY_BRIEFS ? "cloudflare-kv" : "url-fallback",
      configured: Boolean(env.STORY_BRIEFS),
      retentionDays: storyStorageTtlSeconds / 86400,
    },
    newsletter: {
      provider: getActiveNewsletterProvider(env),
      signupStorage: env.NEWSLETTER_SIGNUPS ? "cloudflare-kv" : "none",
    },
    readiness: getReadiness(env),
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
      return jsonResponse(getHealthReport(env), 200, 30);
    }

    if (url.pathname === "/api/news") {
      const topic = url.searchParams.get("topic")?.trim() || "";
      const section = findSection(topic);
      const feeds = section?.feeds || [];

      return cachedJson(request, ctx, 600, async () => {
        const articles = await persistStories(env, await fetchArticles(topic, 12, feeds, { relevance: section?.relevance }));

        return {
          topic: topic || "Top stories",
          articles,
        };
      });
    }

    if (url.pathname === "/api/story") {
      const storyId = url.searchParams.get("id")?.trim() || "";
      const story = await loadStoredStory(env, storyId);

      if (!story) {
        return jsonResponse({ error: "Story not found." }, 404);
      }

      return jsonResponse({ story }, 200, 300);
    }

    if (url.pathname === "/api/subscribe" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const email = typeof body.email === "string" ? body.email.trim() : "";

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonResponse({ error: "Enter a valid email address." }, 400);
      }

      const storage = await storeNewsletterSignup(env, email, request);
      return jsonResponse({
        ok: true,
        message:
          storage.provider === "local-prototype"
            ? "Signup saved locally. Configure a newsletter provider to send subscribers to a real list."
            : `Subscription forwarded to ${storage.provider}.`,
        storage: storage.storage,
        provider: storage.provider,
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

    if (
      url.pathname.startsWith("/topic/") ||
      url.pathname.startsWith("/story/") ||
      url.pathname === "/about" ||
      url.pathname === "/ops" ||
      url.pathname === "/briefing/today"
    ) {
      const indexUrl = new URL("/", url);
      return env.ASSETS.fetch(new Request(indexUrl, request));
    }

    return env.ASSETS.fetch(request);
  },
};
