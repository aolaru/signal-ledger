const searchResults = document.getElementById("search-results");
const statusText = document.getElementById("status");
const searchForm = document.getElementById("search-form");
const topicInput = document.getElementById("topic-input");
const cardTemplate = document.getElementById("card-template");
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
const topicView = document.getElementById("topic-view");
const todayView = document.getElementById("today-view");
const aboutView = document.getElementById("about-view");
const opsView = document.getElementById("ops-view");
const todaySummary = document.getElementById("today-summary");
const todayLead = document.getElementById("today-lead");
const todayGrid = document.getElementById("today-grid");
const navLinks = document.querySelectorAll("[data-nav]");
const opsSummary = document.getElementById("ops-summary");
const opsReadiness = document.getElementById("ops-readiness");
const opsFeeds = document.getElementById("ops-feeds");
const opsMarkets = document.getElementById("ops-markets");

let currentTopic = "";

const apiVersion = "2026-05-24-original-first-v1";
const siteUrl = "https://getsignalledger.com";
const siteName = "SignalLedger";
const defaultDescription =
  "A focused business, technology, markets, and world briefing with original SignalLedger notes built from public RSS signals.";

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

  if (metaDescription) {
    metaDescription.content = description;
  }

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

function getVisibleArticles(articles = []) {
  return articles.filter(Boolean);
}

function humanizeTopic(topic = "") {
  return topic
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function cleanTitle(title = "") {
  return title.replace(/\s[-|]\s[^-|]+$/, "").trim() || title;
}

function getTopicCopy(topic) {
  const topicName = humanizeTopic(topic);
  const lower = topic.toLowerCase();
  const descriptions = {
    "artificial intelligence":
      "AI regulation, model launches, chip supply, enterprise adoption, and the companies shaping the market.",
    markets: "Market-moving headlines across equities, rates, crypto, commodities, and macro policy.",
    romania: "Romanian business, technology, politics, and regional economy stories in a wider European context.",
    europe: "European business, policy, markets, and geopolitics with emphasis on decisions that shape the region.",
    startups: "Funding, product launches, founders, venture capital, and startup market signals worth tracking.",
    energy: "Oil, gas, power, renewables, policy, and infrastructure stories that affect markets and strategy.",
  };

  return {
    title: `${topicName} Briefing`,
    description:
      descriptions[lower] ||
      `Latest ${topicName} headlines, sources, and market context collected into a fast SignalLedger briefing.`,
  };
}

function updateTopicExperience(topic) {
  const copy = getTopicCopy(topic);
  topicTitle.textContent = copy.title;
  topicDescription.textContent = copy.description;

  const path = `/topic/${encodeURIComponent(topic.toLowerCase().replace(/\s+/g, "-"))}`;
  setPageMeta(`${copy.title} | ${siteName}`, copy.description, { path });
  setStructuredData({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${copy.title} | ${siteName}`,
    description: copy.description,
    url: getAbsoluteUrl(path),
  });
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

function getInlineBriefPoints(article) {
  const keyPoints = (article.keyPoints || []).filter(Boolean);
  if (keyPoints.length) {
    return keyPoints.slice(0, 3);
  }

  return [
    `Why it matters: ${article.whyItMatters || article.description || "This story is developing."}`,
    `What to watch: ${buildWatchPoint(article)}`,
    `Source context: ${buildSourceContext(article)}`,
  ];
}

function updateActiveNavigation() {
  const route = getRoute();
  let activeKey = "";

  if (route.type === "today" || route.type === "home") {
    activeKey = "today";
  } else if (route.type === "about") {
    activeKey = "about";
  } else if (route.type === "topic") {
    activeKey = route.topic.toLowerCase().replace(/\s+/g, "-");
  }

  for (const link of navLinks) {
    if (link.dataset.nav === activeKey) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

function showView(viewName) {
  topicView.hidden = viewName !== "topic";
  todayView.hidden = viewName !== "today";
  aboutView.hidden = viewName !== "about";
  opsView.hidden = viewName !== "ops";
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

function createCard(article) {
  const fragment = cardTemplate.content.cloneNode(true);
  const thumbnail = fragment.querySelector(".card-thumbnail");
  const originalLink = fragment.querySelector(".card-link");
  const briefToggle = fragment.querySelector(".brief-toggle");
  const inlineBrief = fragment.querySelector(".inline-brief");
  const inlineSummary = fragment.querySelector(".inline-brief-summary");
  const inlinePoints = fragment.querySelector(".inline-brief-points");

  fragment.querySelector(".news-card").dataset.source = article.source || "";
  thumbnail.src = article.thumbnailUrl || article.visualUrl || article.imageUrl || "/favicon.svg";
  thumbnail.onerror = () => {
    thumbnail.onerror = null;
    thumbnail.src = article.visualUrl || article.imageUrl || "/favicon.svg";
  };
  fragment.querySelector(".card-source").textContent = article.source || "Source";
  fragment.querySelector(".card-title").textContent = cleanTitle(article.title || "Untitled story");
  fragment.querySelector(".card-description").textContent =
    article.briefSummary || article.whyItMatters || article.description || "This story is developing.";
  fragment.querySelector(".card-date").textContent = formatDate(article.publishedAt);
  inlineSummary.textContent = buildStorySummary(article);
  inlinePoints.innerHTML = "";

  for (const point of getInlineBriefPoints(article)) {
    const item = document.createElement("li");
    item.textContent = point;
    inlinePoints.appendChild(item);
  }

  if (article.link) {
    originalLink.href = article.link;
    originalLink.target = "_blank";
    originalLink.rel = "noreferrer";
    originalLink.textContent = "Read original";
  } else {
    originalLink.hidden = true;
  }

  briefToggle.addEventListener("click", () => {
    const isOpen = !inlineBrief.hidden;
    inlineBrief.hidden = isOpen;
    briefToggle.setAttribute("aria-expanded", String(!isOpen));
    briefToggle.textContent = isOpen ? "Signal note" : "Hide note";
  });

  return fragment;
}

function renderArticleGrid(container, articles) {
  container.innerHTML = "";

  for (const article of articles) {
    container.appendChild(createCard(article));
  }
}

function collectBriefingArticles(data) {
  const seen = new Set();
  const sectionArticles = (data.sections || []).flatMap((section) => section.articles || []);
  const articles = [data.lead, ...(data.fastBriefing || []), ...sectionArticles].filter(Boolean);

  return articles.filter((article) => {
    const key = article.link || article.title;
    if (!key || seen.has(key)) {
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

  const topic = getTopicFromPath();
  if (topic) {
    return { type: "topic", topic };
  }

  return { type: "home" };
}

async function loadSearch(topic = "") {
  showView("topic");
  currentTopic = topic.trim();
  topicInput.value = currentTopic;
  updateTopicExperience(currentTopic);
  updateActiveNavigation();
  setStatus("Searching...");
  renderSkeletonGrid(searchResults, 6);

  const params = new URLSearchParams({
    topic: currentTopic,
    v: apiVersion,
  });

  try {
    const response = await fetch(`/api/news?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || data.error || "Unknown error");
    }

    const latestSearchArticles = data.articles || [];
    const visibleArticles = getVisibleArticles(latestSearchArticles);
    setStatus(`${visibleArticles.length} stories loaded`);
    renderArticleGrid(searchResults, visibleArticles.slice(0, 12));
  } catch (error) {
    setStatus(error.message, true);
    renderErrorPanel(searchResults, error.message, () => loadSearch(currentTopic));
  }
}

async function loadTodayBriefing() {
  showView("today");
  currentTopic = "";
  updateActiveNavigation();
  setPageMeta(
    `${siteName} Briefing`,
    "A concise SignalLedger briefing of today's business, technology, markets, and world headlines.",
    {
      path: "/",
    },
  );
  setStructuredData({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${siteName} Briefing`,
    description: "A concise SignalLedger briefing of today's business, technology, markets, and world headlines.",
    url: getAbsoluteUrl("/"),
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

    renderTodayBriefing(data);
  } catch (error) {
    todaySummary.textContent = error.message;
    renderErrorPanel(todayGrid, error.message, loadTodayBriefing);
  }
}

function loadAbout() {
  showView("about");
  currentTopic = "";
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
  updateActiveNavigation();
  setPageMeta(`Operations | ${siteName}`, "Operational diagnostics for SignalLedger feeds, signup storage, and market data.", {
    path: "/ops",
  });
  setStructuredData({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Operations | ${siteName}`,
    description: "Operational diagnostics for SignalLedger feeds, signup storage, and market data.",
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

  if (route.type === "topic") {
    await loadSearch(route.topic);
    return;
  }

  topicInput.value = "";
  await loadTodayBriefing();
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
  loadTodayBriefing();
});

window.addEventListener("popstate", loadRoute);
window.addEventListener("hashchange", updateActiveNavigation);

loadRoute();
