const searchResults = document.getElementById("search-results");
const sectionsContainer = document.getElementById("sections");
const statusText = document.getElementById("status");
const feedTitle = document.getElementById("feed-title");
const searchForm = document.getElementById("search-form");
const topicInput = document.getElementById("topic-input");
const lastUpdated = document.getElementById("last-updated");
const refreshButton = document.getElementById("refresh-button");
const cardTemplate = document.getElementById("card-template");
const leadStory = document.getElementById("lead-story");
const briefingList = document.getElementById("briefing-list");
const marketStrip = document.getElementById("market-strip");
const marketStatus = document.getElementById("market-status");
const newsletterPanel = document.getElementById("newsletter-panel");
const newsletterForm = document.getElementById("newsletter-form");
const newsletterEmail = document.getElementById("newsletter-email");
const newsletterStatus = document.getElementById("newsletter-status");
const topicPanel = document.getElementById("topic-panel");
const topicTitle = document.getElementById("topic-title");
const topicDescription = document.getElementById("topic-description");
const metaDescription = document.querySelector("meta[name='description']");
const robotsMeta = document.getElementById("robots-meta");
const canonicalLink = document.getElementById("canonical-link");
const structuredDataScript = document.getElementById("structured-data");
const ogTitle = document.querySelector("meta[property='og:title']");
const ogDescription = document.querySelector("meta[property='og:description']");
const ogUrl = document.querySelector("meta[property='og:url']");
const twitterTitle = document.querySelector("meta[name='twitter:title']");
const twitterDescription = document.querySelector("meta[name='twitter:description']");
const homeView = document.getElementById("home-view");
const todayView = document.getElementById("today-view");
const storyView = document.getElementById("story-view");
const aboutView = document.getElementById("about-view");
const opsView = document.getElementById("ops-view");
const todaySummary = document.getElementById("today-summary");
const todayLead = document.getElementById("today-lead");
const todayGrid = document.getElementById("today-grid");
const navLinks = document.querySelectorAll("[data-nav]");
const storyImage = document.getElementById("story-image");
const storyKicker = document.getElementById("story-kicker");
const storyTitle = document.getElementById("story-title");
const storyMeta = document.getElementById("story-meta");
const storySummary = document.getElementById("story-summary");
const storyKeyPoints = document.getElementById("story-key-points");
const storySourceContext = document.getElementById("story-source-context");
const storyWhy = document.getElementById("story-why");
const storyWatch = document.getElementById("story-watch");
const storyOriginalLink = document.getElementById("story-original-link");
const newsletterSubmit = document.getElementById("newsletter-submit");
const opsSummary = document.getElementById("ops-summary");
const opsReadiness = document.getElementById("ops-readiness");
const opsFeeds = document.getElementById("ops-feeds");
const opsMarkets = document.getElementById("ops-markets");

let currentTopic = "";
let latestBriefing = null;
let latestSearchArticles = [];
const savedEmail = localStorage.getItem("newsletterEmail");
const apiVersion = "2026-05-24-varied-thumbnails-v1";
const siteUrl = "https://getsignalledger.com";
const siteName = "SignalLedger";
const newsRefreshMs = 10 * 60 * 1000;
const marketRefreshMs = 60 * 1000;
const fastBriefingLimit = 5;
const homeSectionLimit = 4;
const homeStoriesPerSection = 2;
const featuredMarketKeys = new Set(["spx", "nasdaq", "btc"]);
let lastNewsRefreshAt = 0;
let marketRefreshTimer;
let newsRefreshTimer;
const defaultDescription =
  "A focused business, technology, markets, and world briefing with original SignalLedger notes built from public RSS signals.";

if (savedEmail) {
  newsletterEmail.value = savedEmail;
  newsletterStatus.textContent = "Your email is saved for the briefing list.";
  newsletterStatus.dataset.state = "saved";
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

function setLastUpdated(value = new Date()) {
  lastUpdated.textContent = `Last update: ${formatDate(value)}`;
  lastNewsRefreshAt = Date.now();
}

function getAbsoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

function setStructuredData(data) {
  if (structuredDataScript) {
    structuredDataScript.textContent = JSON.stringify(data);
  }
}

function setPageMeta(title, description = defaultDescription, options = {}) {
  const path = options.path || window.location.pathname + window.location.search;
  const absoluteUrl = getAbsoluteUrl(path);

  document.title = title;
  metaDescription.content = description;

  if (robotsMeta) {
    robotsMeta.content = options.robots || "index,follow";
  }

  if (canonicalLink) {
    canonicalLink.href = absoluteUrl;
  }

  if (ogTitle) {
    ogTitle.content = title;
  }

  if (ogDescription) {
    ogDescription.content = description;
  }

  if (ogUrl) {
    ogUrl.content = absoluteUrl;
  }

  if (twitterTitle) {
    twitterTitle.content = title;
  }

  if (twitterDescription) {
    twitterDescription.content = description;
  }
}

function formatMarketValue(market) {
  const options =
    market.value > 100
      ? { maximumFractionDigits: 0 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 4 };
  const value = new Intl.NumberFormat("en-US", options).format(market.value);

  return `${market.currency || ""}${value}`;
}

function getVisibleArticles(articles) {
  return articles.filter(Boolean);
}

function humanizeTopic(topic) {
  return topic
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function cleanTitle(title = "") {
  return title.replace(/\s[-|]\s[^-|]+$/, "").trim() || title;
}

function slugify(value = "") {
  const slug = cleanTitle(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 82);

  return slug || "briefing";
}

function base64UrlEncode(value) {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return JSON.parse(new TextDecoder().decode(bytes));
}

function getTopicCopy(topic) {
  const topicName = humanizeTopic(topic);
  const lower = topic.toLowerCase();
  const descriptions = {
    "artificial intelligence":
      "AI regulation, model launches, chip supply, enterprise adoption, and the companies shaping the market.",
    markets:
      "Market-moving headlines across equities, rates, crypto, commodities, and macro policy.",
    romania:
      "Romanian business, technology, politics, and regional economy stories in a wider European context.",
    europe:
      "European business, policy, markets, and geopolitics with emphasis on decisions that shape the region.",
    startups:
      "Funding, product launches, founders, venture capital, and startup market signals worth tracking.",
    energy:
      "Oil, gas, power, renewables, policy, and infrastructure stories that affect markets and strategy.",
  };

  return {
    title: `${topicName} Briefing`,
    description:
      descriptions[lower] ||
      `Latest ${topicName} headlines, sources, and market context collected into a fast SignalLedger briefing.`,
  };
}

function updateTopicExperience(topic = "") {
  if (!topic) {
    topicPanel.hidden = true;
    setPageMeta(`${siteName} Briefing`, defaultDescription, {
      path: "/",
    });
    setStructuredData({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url: siteUrl,
      description: defaultDescription,
    });
    return;
  }

  const copy = getTopicCopy(topic);
  topicPanel.hidden = false;
  topicTitle.textContent = copy.title;
  topicDescription.textContent = copy.description;
  setPageMeta(`${copy.title} | ${siteName}`, copy.description, {
    path: `/topic/${encodeURIComponent(topic.toLowerCase().replace(/\s+/g, "-"))}`,
  });
  setStructuredData({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${copy.title} | ${siteName}`,
    description: copy.description,
    url: getAbsoluteUrl(`/topic/${encodeURIComponent(topic.toLowerCase().replace(/\s+/g, "-"))}`),
  });
}

function getSectionDeck(key) {
  const decks = {
    business: "Company moves, deal flow, strategy, and earnings pressure worth tracking.",
    tech: "AI, platforms, chips, software, and the technology decisions shaping markets.",
    markets: "Equities, rates, crypto, commodities, and macro stories with price impact.",
    world: "Geopolitics, power shifts, trade, and security headlines with business consequences.",
    europe: "Policy, economy, business, and strategic signals from across the region.",
    romania: "Romanian business and political stories placed in regional context.",
  };

  return decks[key] || "The latest stories with source context and business relevance.";
}

function getStoryLabel(article) {
  const text = `${article.title || ""} ${article.description || ""} ${article.whyItMatters || ""}`.toLowerCase();

  if (article.clusterCount > 1) {
    return "Top story";
  }

  if (/(stock|market|earnings|investor|inflation|rates|oil|gold|bitcoin|crypto)/.test(text)) {
    return "Market signal";
  }

  if (/(war|tariff|sanction|election|minister|government|regulation|geopolitic)/.test(text)) {
    return "Developing";
  }

  if (/(ai|artificial intelligence|chip|software|technology|startup|app)/.test(text)) {
    return "Tech watch";
  }

  return "Briefing note";
}

function getStoryPayload(article) {
  return {
    storyId: article.storyId,
    storySlug: article.storySlug || slugify(article.title),
    storyStored: Boolean(article.storyStored),
    title: cleanTitle(article.title),
    source: article.source,
    publishedAt: article.publishedAt,
    description: article.description,
    whyItMatters: article.whyItMatters,
    link: article.link,
    imageUrl: article.imageUrl,
    thumbnailUrl: article.thumbnailUrl,
    visualUrl: article.visualUrl,
    clusterCount: article.clusterCount,
    clusterSources: article.clusterSources,
    label: getStoryLabel(article),
    briefSummary: article.briefSummary,
    watchPoint: article.watchPoint,
    sourceContext: article.sourceContext,
    keyPoints: article.keyPoints,
    angle: article.angle,
  };
}

function getStoredStoryPath(article) {
  const storyId = article.storyId || article.id;
  const storySlug = article.storySlug || slugify(article.title || storyId || "briefing");
  return `/story/${encodeURIComponent(storyId)}/${storySlug}`;
}

function getStoryUrl(article) {
  const payload = getStoryPayload(article);

  if (payload.storyStored && payload.storyId) {
    return getStoredStoryPath(payload);
  }

  return `/story/${payload.storySlug}?data=${base64UrlEncode(payload)}`;
}

function buildStorySummary(article) {
  if (article.briefSummary) {
    return article.briefSummary;
  }

  const source = article.source || "the original source";
  const title = cleanTitle(article.title || "This story");
  const context = article.whyItMatters || article.description || "The story is still developing.";

  return `${source} is tracking ${title.toLowerCase()}. The useful signal for readers is this: ${context}`;
}

function buildWatchPoint(article) {
  if (article.watchPoint) {
    return article.watchPoint;
  }

  const text = `${article.title || ""} ${article.description || ""}`.toLowerCase();

  if (/(stock|market|earnings|investor|rates|inflation|oil|gold|bitcoin|crypto)/.test(text)) {
    return "Watch whether the story changes pricing, investor positioning, or expectations in the next market session.";
  }

  if (/(war|tariff|sanction|election|government|minister|regulation)/.test(text)) {
    return "Watch for policy responses, official statements, and second-order effects for companies exposed to the region.";
  }

  if (/(ai|chip|software|startup|technology|app)/.test(text)) {
    return "Watch for product, regulatory, or capital-allocation signals that show whether this becomes a durable tech trend.";
  }

  return "Watch whether other credible sources confirm the direction and whether the story develops beyond the first headline.";
}

function buildSourceContext(article) {
  if (article.sourceContext) {
    return article.sourceContext;
  }

  if (article.clusterCount > 1 && article.clusterSources?.length) {
    return `${article.clusterCount} sources are tracking this story: ${article.clusterSources.slice(0, 4).join(", ")}.`;
  }

  return `${article.source || "The source"} is the primary source surfaced in the current briefing snapshot.`;
}

function setNewsletterStatus(message, state = "info") {
  newsletterStatus.textContent = message;
  newsletterStatus.dataset.state = state;
}

function updateActiveNavigation() {
  const route = getRoute();
  const hashKey = window.location.hash.replace("#", "");
  let activeKey = "";

  if (route.type === "today") {
    activeKey = "today";
  } else if (route.type === "home") {
    activeKey = "today";
  } else if (route.type === "about") {
    activeKey = "about";
  } else if (route.type === "topic") {
    activeKey = route.topic.toLowerCase().replace(/\s+/g, "-");
  } else if (hashKey) {
    activeKey = hashKey;
  }

  for (const link of navLinks) {
    const isActive = link.dataset.nav === activeKey;
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

function showView(viewName) {
  homeView.hidden = viewName !== "home";
  todayView.hidden = viewName !== "today";
  storyView.hidden = viewName !== "story";
  aboutView.hidden = viewName !== "about";
  opsView.hidden = viewName !== "ops";
}

function setHomeMode(mode = "briefing") {
  homeView.dataset.mode = mode;
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("status-error", isError);
}

function createSkeletonCard() {
  const card = document.createElement("article");
  card.className = "news-card skeleton-card";
  card.setAttribute("aria-hidden", "true");
  card.innerHTML = `
    <span class="skeleton-line short"></span>
    <span class="skeleton-line title"></span>
    <span class="skeleton-line"></span>
    <span class="skeleton-line medium"></span>
  `;
  return card;
}

function renderSkeletonGrid(container, count = 3) {
  container.innerHTML = "";
  for (let index = 0; index < count; index += 1) {
    container.appendChild(createSkeletonCard());
  }
}

function renderErrorPanel(container, message, retry) {
  container.innerHTML = "";
  const panel = document.createElement("article");
  panel.className = "error-panel";

  const label = document.createElement("p");
  label.className = "section-label";
  label.textContent = "Could not load";

  const title = document.createElement("h2");
  title.textContent = "News is temporarily unavailable.";

  const detail = document.createElement("p");
  detail.textContent = message;

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Try again";
  button.addEventListener("click", retry);

  panel.append(label, title, detail, button);
  container.appendChild(panel);
}

function renderBriefingSkeleton() {
  leadStory.innerHTML = `
    <span class="skeleton-line short"></span>
    <span class="skeleton-line title"></span>
    <span class="skeleton-line title"></span>
    <span class="skeleton-line medium"></span>
  `;
  briefingList.innerHTML = "";
  for (let index = 0; index < fastBriefingLimit; index += 1) {
    const item = document.createElement("li");
    item.className = "skeleton-list-item";
    item.innerHTML = `<span class="skeleton-line"></span><span class="skeleton-line short"></span>`;
    briefingList.appendChild(item);
  }

  marketStatus.textContent = "Loading live data...";
  marketStrip.innerHTML = "";
  for (let index = 0; index < featuredMarketKeys.size; index += 1) {
    const market = document.createElement("article");
    market.className = "market-card skeleton-market";
    market.innerHTML = `<span class="skeleton-line short"></span><span class="skeleton-line medium"></span>`;
    marketStrip.appendChild(market);
  }

  sectionsContainer.innerHTML = "";
  renderSkeletonGrid(searchResults, 0);
  const block = document.createElement("section");
  block.className = "section-block";
  const heading = document.createElement("h2");
  heading.textContent = "Loading stories";
  const grid = document.createElement("div");
  grid.className = "news-grid";
  renderSkeletonGrid(grid, 3);
  block.append(heading, grid);
  sectionsContainer.appendChild(block);
}

function createCard(article) {
  const fragment = cardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".news-card");

  card.dataset.source = article.source;
  const thumbnail = fragment.querySelector(".card-thumbnail");
  thumbnail.src = article.thumbnailUrl || article.visualUrl || article.imageUrl || "/favicon.svg";
  thumbnail.onerror = () => {
    thumbnail.onerror = null;
    thumbnail.src = article.visualUrl || article.imageUrl || "/favicon.svg";
  };
  fragment.querySelector(".card-source").textContent = article.source;
  fragment.querySelector(".card-title").textContent = article.title;
  fragment.querySelector(".card-description").textContent =
    article.briefSummary || article.whyItMatters || article.description || "This story is developing.";
  fragment.querySelector(".card-date").textContent = formatDate(article.publishedAt);

  const link = fragment.querySelector(".card-link");
  link.href = getStoryUrl(article);

  return fragment;
}

function renderArticleGrid(container, articles) {
  container.innerHTML = "";

  for (const article of articles) {
    container.appendChild(createCard(article));
  }
}

function renderLead(article) {
  if (!article) {
    leadStory.innerHTML = "<p>No lead story is available right now.</p>";
    return;
  }

  leadStory.innerHTML = "";

  const visual = document.createElement("img");
  visual.className = "lead-visual";
  visual.src = article.visualUrl || article.imageUrl || "/favicon.svg";
  visual.alt = "";

  const content = document.createElement("div");
  content.className = "lead-content";

  const source = document.createElement("span");
  source.className = "lead-source";

  const logo = document.createElement("img");
  logo.src = article.imageUrl || "/favicon.svg";
  logo.alt = "";
  source.append(logo, article.source, " ");

  const time = document.createElement("span");
  time.textContent = formatDate(article.publishedAt);
  source.appendChild(time);

  const title = document.createElement("h2");
  title.textContent = article.title;

  const summary = document.createElement("p");
  summary.textContent = article.briefSummary || article.whyItMatters || article.description || "This story is developing.";

  const link = document.createElement("a");
  link.className = "lead-link";
  link.href = getStoryUrl(article);
  link.textContent = "Read the brief";

  content.append(source, title, summary, link);
  leadStory.append(visual, content);

  const panel = document.querySelector(".lead-panel");
  if (panel) {
    panel.style.backgroundImage = "";
  }
}

function renderFastBriefing(articles) {
  briefingList.innerHTML = "";

  for (const article of getVisibleArticles(articles).slice(0, fastBriefingLimit)) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = getStoryUrl(article);
    link.textContent = article.title;

    const meta = document.createElement("span");
    meta.textContent = `${article.source} · ${formatDate(article.publishedAt)}`;

    item.append(link, meta);
    briefingList.appendChild(item);
  }
}

function renderSections(sections, options = {}) {
  sectionsContainer.innerHTML = "";
  const sectionLimit = options.sectionLimit || homeSectionLimit;
  const storiesPerSection = options.storiesPerSection || homeStoriesPerSection;

  for (const section of sections.slice(0, sectionLimit)) {
    const block = document.createElement("section");
    block.className = "section-block";
    block.id = section.key;

    const header = document.createElement("div");
    header.className = "section-header";

    const heading = document.createElement("h2");
    heading.textContent = section.label;

    const deck = document.createElement("p");
    deck.textContent = getSectionDeck(section.key);

    const grid = document.createElement("div");
    grid.className = "news-grid";
    renderArticleGrid(grid, getVisibleArticles(section.articles).slice(0, storiesPerSection));

    header.append(heading, deck);
    block.append(header, grid);
    sectionsContainer.appendChild(block);
  }
}

function collectBriefingArticles(data) {
  const seen = new Set();
  const articles = [data.lead, ...data.fastBriefing, ...data.sections.flatMap((section) => section.articles)].filter(
    Boolean,
  );

  return articles.filter((article) => {
    const key = article.link || article.title;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function renderTodayBriefing(data) {
  const visibleArticles = getVisibleArticles(collectBriefingArticles(data));
  const displayedArticles = visibleArticles.slice(0, 10);
  todaySummary.textContent = `${displayedArticles.length} top stories from the latest briefing. Updated ${formatDate(
    data.generatedAt,
  )}.`;
  todayLead.innerHTML = "";

  if (displayedArticles[0]) {
    todayLead.appendChild(createCard(displayedArticles[0]));
  }

  renderArticleGrid(todayGrid, displayedArticles.slice(1));
}

function renderMarkets(markets) {
  marketStrip.innerHTML = "";

  if (!markets?.length) {
    marketStatus.textContent = "Market data unavailable";
    return;
  }

  const featuredMarkets = markets.filter((market) => featuredMarketKeys.has(market.key)).slice(0, 3);
  const displayedMarkets = featuredMarkets.length ? featuredMarkets : markets.slice(0, 3);
  const latestUpdate = markets
    .map((market) => new Date(market.updatedAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((first, second) => second - first)[0];

  const hasFallback = markets.some((market) => market.isFallback);
  marketStatus.textContent = hasFallback
    ? "Delayed market snapshot"
    : latestUpdate
      ? `Updated ${formatDate(latestUpdate)}`
      : "Live data";

  for (const market of displayedMarkets) {
    const card = document.createElement("article");
    const direction = market.percentChange >= 0 ? "up" : "down";
    card.className = `market-card ${direction}`;

    const label = document.createElement("span");
    label.textContent = market.label;

    const value = document.createElement("strong");
    value.textContent = formatMarketValue(market);

    const change = document.createElement("em");
    change.textContent = `${market.percentChange >= 0 ? "+" : ""}${market.percentChange.toFixed(2)}%`;
    if (market.isFallback) {
      change.title = "Fallback snapshot shown because live provider data is unavailable.";
    }

    card.append(label, value, change);
    marketStrip.appendChild(card);
  }
}

async function loadMarkets() {
  if (document.hidden) {
    return;
  }

  try {
    const cacheKey = Math.floor(Date.now() / marketRefreshMs);
    const response = await fetch(`/api/markets?v=${apiVersion}&t=${cacheKey}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || data.error || "Unknown error");
    }

    renderMarkets(data.markets);
  } catch (error) {
    marketStatus.textContent = error.message;
  }
}

function refreshCurrentNews() {
  if (document.hidden) {
    return;
  }

  const route = getRoute();
  if (route.type === "about" || route.type === "story" || route.type === "ops") {
    return;
  }

  if (route.type === "today") {
    loadTodayBriefing();
    return;
  }

  if (currentTopic) {
    loadSearch(currentTopic);
    return;
  }

  loadTodayBriefing({ isHome: true });
}

function startAutoRefresh() {
  window.clearInterval(marketRefreshTimer);
  window.clearInterval(newsRefreshTimer);

  marketRefreshTimer = window.setInterval(loadMarkets, marketRefreshMs);
  newsRefreshTimer = window.setInterval(refreshCurrentNews, newsRefreshMs);
}

function getTopicFromPath() {
  const match = window.location.pathname.match(/^\/topic\/([^/]+)/);
  if (!match) {
    return "";
  }

  return decodeURIComponent(match[1]).replace(/-/g, " ");
}

function getRoute() {
  if (window.location.pathname === "/about") {
    return { type: "about" };
  }

  if (window.location.pathname === "/ops") {
    return { type: "ops" };
  }

  if (window.location.pathname === "/briefing/today") {
    return { type: "today" };
  }

  if (window.location.pathname.startsWith("/story/")) {
    return { type: "story" };
  }

  const topic = getTopicFromPath();
  if (topic) {
    return { type: "topic", topic };
  }

  return { type: "home" };
}

function getStoryRouteDetails() {
  const pathMatch = window.location.pathname.match(/^\/story\/([^/]+)(?:\/([^/]+))?$/);
  const params = new URLSearchParams(window.location.search);

  return {
    storyId: pathMatch?.[2] ? decodeURIComponent(pathMatch[1]) : params.get("id")?.trim() || "",
    storySlug: pathMatch?.[2] ? decodeURIComponent(pathMatch[2]) : pathMatch?.[1] ? decodeURIComponent(pathMatch[1]) : "",
    encoded: params.get("data"),
  };
}

async function fetchStoredStory(storyId) {
  const response = await fetch(`/api/story?id=${encodeURIComponent(storyId)}&v=${apiVersion}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.details || data.error || "Story brief unavailable");
  }

  return data.story;
}

function renderStoryPage(article) {
  const title = cleanTitle(article.title);
  const source = article.source || "Original source";
  const published = formatDate(article.publishedAt);
  const canonicalPath = article.storyId ? getStoredStoryPath(article) : window.location.pathname + window.location.search;

  storyImage.src = article.visualUrl || article.thumbnailUrl || article.imageUrl || "/favicon.svg";
  storyImage.alt = "";
  storyKicker.textContent = article.label || getStoryLabel(article);
  storyTitle.textContent = title;
  storyMeta.textContent = `${source}${published ? ` · ${published}` : ""}`;
  storySummary.textContent = buildStorySummary(article);
  storySourceContext.textContent = buildSourceContext(article);
  storyWhy.textContent = article.whyItMatters || article.description || "This story is developing.";
  storyWatch.textContent = buildWatchPoint(article);
  storyKeyPoints.innerHTML = "";
  for (const point of article.keyPoints || []) {
    const item = document.createElement("li");
    item.textContent = point;
    storyKeyPoints.appendChild(item);
  }
  storyKeyPoints.hidden = storyKeyPoints.children.length === 0;
  storyOriginalLink.href = article.link || "#";
  storyOriginalLink.hidden = !article.link;
  storyOriginalLink.textContent = `Read original article on ${source}`;
  setPageMeta(`${title} | ${siteName}`, buildStorySummary(article), {
    path: canonicalPath,
    robots: "noindex,follow",
  });
  setStructuredData({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description: buildStorySummary(article),
    url: getAbsoluteUrl(canonicalPath),
    isPartOf: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
    isBasedOn: article.link || undefined,
    image: article.visualUrl ? [article.visualUrl] : undefined,
    author: article.source
      ? {
          "@type": "Organization",
          name: article.source,
        }
      : undefined,
  });
}

function renderMissingStory(title, summary, why, watch) {
  storyImage.src = "/favicon.svg";
  storyImage.alt = "";
  storyKicker.textContent = "Story unavailable";
  storyTitle.textContent = title;
  storyMeta.textContent = "";
  storySummary.textContent = summary;
  storySourceContext.textContent = "";
  storyWhy.textContent = why;
  storyWatch.textContent = watch;
  storyKeyPoints.innerHTML = "";
  storyKeyPoints.hidden = true;
  storyOriginalLink.hidden = true;
  setPageMeta(`Story unavailable | ${siteName}`, defaultDescription, {
    path: window.location.pathname + window.location.search,
    robots: "noindex,follow",
  });
  setStructuredData({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Story unavailable",
    url: getAbsoluteUrl(window.location.pathname + window.location.search),
  });
}

async function loadStoryPage() {
  const { storyId, encoded } = getStoryRouteDetails();

  showView("story");
  currentTopic = "";
  latestSearchArticles = [];
  updateTopicExperience("");
  updateActiveNavigation();

  if (!storyId && !encoded) {
    renderMissingStory(
      "Story brief unavailable",
      "This story link is missing its briefing data. Return to the homepage and open it again.",
      "The link does not contain a stored story ID or a fallback article payload.",
      "Open the article again from the homepage or topic page to regenerate the brief link.",
    );
    return;
  }

  try {
    let article = null;

    if (storyId) {
      try {
        article = await fetchStoredStory(storyId);
        if (!encoded && window.location.pathname !== getStoredStoryPath(article)) {
          window.history.replaceState({}, "", getStoredStoryPath(article));
        }
      } catch (error) {
        if (!encoded) {
          throw error;
        }
      }
    }

    if (!article && encoded) {
      article = base64UrlDecode(encoded);
    }

    if (!article) {
      throw new Error("Story brief unavailable");
    }

    renderStoryPage(article);
  } catch (error) {
    renderMissingStory(
      "Story brief unavailable",
      "This story could not be loaded right now. Return to the homepage and open it again.",
      error.message,
      "If the stored story is no longer available, the encoded fallback link should still work for newly opened articles.",
    );
  }
}

function rerenderCurrentView() {
  const route = getRoute();

  if (latestBriefing && route.type === "today") {
    renderTodayBriefing(latestBriefing);
  } else if (latestBriefing && route.type !== "topic" && route.type !== "home") {
    renderFastBriefing(latestBriefing.fastBriefing);
    renderSections(latestBriefing.sections);
  }

  if (latestSearchArticles.length) {
    const visibleSearchArticles = getVisibleArticles(latestSearchArticles);
    statusText.textContent = `${visibleSearchArticles.length} stories loaded`;
    renderArticleGrid(searchResults, visibleSearchArticles.slice(0, 8));
  }
}

async function loadBriefing() {
  showView("home");
  setHomeMode("briefing");
  updateActiveNavigation();
  setStatus("Loading briefing...");
  searchResults.innerHTML = "";
  latestSearchArticles = [];
  currentTopic = "";
  updateTopicExperience("");
  renderBriefingSkeleton();

  try {
    const response = await fetch(`/api/briefing?v=${apiVersion}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || data.error || "Unknown error");
    }

    latestBriefing = data;
    renderLead(data.lead);
    renderFastBriefing(data.fastBriefing);
    renderMarkets(data.markets);
    renderSections(data.sections);
    setStatus(`Briefing updated ${formatDate(data.generatedAt)}`);
    setLastUpdated(data.generatedAt);
    setPageMeta(`${siteName} Briefing`, defaultDescription, {
      path: "/",
    });
    setStructuredData({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${siteName} Briefing`,
      description: defaultDescription,
      url: getAbsoluteUrl("/"),
    });
  } catch (error) {
    setStatus(error.message, true);
    renderErrorPanel(sectionsContainer, error.message, loadBriefing);
  }
}

async function loadSearch(topic = "") {
  showView("home");
  currentTopic = topic.trim();
  setHomeMode(currentTopic ? "topic" : "briefing");
  updateTopicExperience(currentTopic);
  updateActiveNavigation();
  setStatus("Searching...");
  renderSkeletonGrid(searchResults, 3);
  sectionsContainer.innerHTML = "";

  const params = new URLSearchParams();
  if (currentTopic) {
    params.set("topic", currentTopic);
  }

  try {
    params.set("v", apiVersion);

    const response = await fetch(`/api/news?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || data.error || "Unknown error");
    }

    latestSearchArticles = data.articles;
    feedTitle.textContent = currentTopic ? `Latest on ${humanizeTopic(currentTopic)}` : "Search briefing";
    setStatus(`${getVisibleArticles(data.articles).length} stories loaded`);
    setLastUpdated();
    renderArticleGrid(searchResults, getVisibleArticles(data.articles).slice(0, 8));
  } catch (error) {
    feedTitle.textContent = currentTopic || "Search briefing";
    setStatus(error.message, true);
    renderErrorPanel(searchResults, error.message, () => loadSearch(currentTopic));
  }
}

async function loadTodayBriefing({ isHome = false } = {}) {
  showView("today");
  currentTopic = "";
  latestSearchArticles = [];
  updateTopicExperience("");
  updateActiveNavigation();
  setPageMeta(
    isHome ? `${siteName} Briefing` : `Today's Briefing | ${siteName}`,
    "A concise SignalLedger briefing of today's business, technology, markets, and world headlines.",
    {
      path: isHome ? "/" : "/briefing/today",
    },
  );
  setStructuredData({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isHome ? `${siteName} Briefing` : `Today's Briefing | ${siteName}`,
    description: "A concise SignalLedger briefing of today's business, technology, markets, and world headlines.",
    url: getAbsoluteUrl(isHome ? "/" : "/briefing/today"),
  });
  todaySummary.textContent = "Loading the latest briefing...";
  renderSkeletonGrid(todayGrid, 6);
  renderSkeletonGrid(todayLead, 1);

  try {
    const response = await fetch(`/api/briefing?v=${apiVersion}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || data.error || "Unknown error");
    }

    latestBriefing = data;
    renderTodayBriefing(data);
    setLastUpdated(data.generatedAt);
  } catch (error) {
    todaySummary.textContent = error.message;
    renderErrorPanel(todayGrid, error.message, loadTodayBriefing);
  }
}

function loadAbout() {
  showView("about");
  currentTopic = "";
  latestSearchArticles = [];
  updateTopicExperience("");
  updateActiveNavigation();
  setPageMeta(
    `About ${siteName}`,
    "SignalLedger is a business news briefing for readers who want market, technology, and geopolitical signal fast.",
    {
      path: "/about",
    },
  );
  setStructuredData({
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About ${siteName}`,
    description: "SignalLedger is a business news briefing for readers who want market, technology, and geopolitical signal fast.",
    url: getAbsoluteUrl("/about"),
  });
}

function renderOpsList(container, items, emptyMessage) {
  container.innerHTML = "";

  if (!items?.length) {
    const empty = document.createElement("p");
    empty.className = "ops-empty";
    empty.textContent = emptyMessage;
    container.appendChild(empty);
    return;
  }

  for (const item of items) {
    const row = document.createElement("article");
    row.className = "ops-item";

    const heading = document.createElement("div");
    heading.className = "ops-item-header";

    const title = document.createElement("strong");
    title.textContent = item.name || item.label || item.key;

    const status = document.createElement("span");
    status.className = `ops-status ${item.status || "info"}`;
    status.textContent = item.status || "info";

    const detail = document.createElement("p");
    detail.textContent =
      item.detail ||
      item.lastError ||
      [item.provider, item.latencyMs ? `${item.latencyMs}ms` : "", item.articleCount ? `${item.articleCount} stories` : ""]
        .filter(Boolean)
        .join(" · ");

    heading.append(title, status);
    row.append(heading, detail);
    container.appendChild(row);
  }
}

async function loadOps() {
  showView("ops");
  currentTopic = "";
  latestSearchArticles = [];
  updateTopicExperience("");
  updateActiveNavigation();
  setPageMeta(`Operations | ${siteName}`, "Operational diagnostics for SignalLedger feeds, storage, and newsletter delivery.", {
    path: "/ops",
  });
  setStructuredData({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Operations | ${siteName}`,
    description: "Operational diagnostics for SignalLedger feeds, storage, and newsletter delivery.",
    url: getAbsoluteUrl("/ops"),
  });

  opsSummary.textContent = "Loading production-readiness diagnostics...";
  opsReadiness.innerHTML = "";
  renderOpsList(opsFeeds, [], "No feed diagnostics yet.");
  renderOpsList(opsMarkets, [], "No market diagnostics yet.");

  try {
    const response = await fetch(`/api/health?v=${apiVersion}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || data.error || "Could not load operations data.");
    }

    const readiness = data.readiness || [];
    const launchReady = readiness.every((item) => item.status === "ready" || item.status === "advisory");
    opsSummary.textContent = launchReady
      ? "Core production systems are configured. Review source health and fallback usage below."
      : "Production setup still has required actions before launch. Review the readiness cards below.";

    renderOpsList(opsReadiness, readiness, "No readiness items available.");
    renderOpsList(opsFeeds, data.feeds, "No feed diagnostics available yet.");
    renderOpsList(opsMarkets, data.markets, "No market diagnostics available yet.");
  } catch (error) {
    opsSummary.textContent = error.message;
    renderOpsList(opsReadiness, [], "No readiness items available.");
    renderOpsList(opsFeeds, [], "No feed diagnostics available yet.");
    renderOpsList(opsMarkets, [], "No market diagnostics available yet.");
  }
}

async function loadProductReadiness() {
  try {
    const response = await fetch(`/api/health?v=${apiVersion}`);
    const data = await response.json();
    newsletterPanel.hidden = !response.ok || data.newsletter?.provider === "local-prototype";
  } catch {
    newsletterPanel.hidden = true;
  }
}

async function loadRoute() {
  const route = getRoute();

  if (route.type === "about") {
    loadAbout();
    return;
  }

  if (route.type === "ops") {
    await loadOps();
    return;
  }

  if (route.type === "today") {
    await loadTodayBriefing();
    return;
  }

  if (route.type === "story") {
    await loadStoryPage();
    return;
  }

  if (route.type === "topic") {
    topicInput.value = route.topic;
    await loadSearch(route.topic);
    return;
  }

  topicInput.value = "";
  await loadTodayBriefing({ isHome: true });
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const topic = topicInput.value.trim();
  if (topic) {
    window.history.pushState({}, "", `/topic/${encodeURIComponent(topic.toLowerCase().replace(/\s+/g, "-"))}`);
    loadRoute();
    return;
  }

  window.history.pushState({}, "", "/");
  loadTodayBriefing({ isHome: true });
});

refreshButton.addEventListener("click", () => {
  refreshCurrentNews();
});

newsletterForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = newsletterEmail.value.trim();
  newsletterSubmit.disabled = true;
  newsletterForm.setAttribute("aria-busy", "true");
  setNewsletterStatus("Joining...", "pending");

  try {
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not join right now.");
    }

    localStorage.setItem("newsletterEmail", email);
    setNewsletterStatus(
      data.provider && data.provider !== "local-prototype"
        ? `${data.message || "You are on the briefing list."} Check your inbox if confirmation is required.`
        : data.message || "You are on the briefing list.",
      data.provider && data.provider !== "local-prototype" ? "success" : "saved",
    );
  } catch (error) {
    setNewsletterStatus(error.message, "error");
  } finally {
    newsletterSubmit.disabled = false;
    newsletterForm.removeAttribute("aria-busy");
  }
});

window.addEventListener("popstate", loadRoute);
window.addEventListener("hashchange", updateActiveNavigation);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    return;
  }

  loadMarkets();
  if (Date.now() - lastNewsRefreshAt > newsRefreshMs) {
    refreshCurrentNews();
  }
});

loadProductReadiness();
loadRoute();
startAutoRefresh();
