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
const sourceControls = document.getElementById("source-controls");
const hiddenCount = document.getElementById("hidden-count");
const resetSources = document.getElementById("reset-sources");
const newsletterForm = document.getElementById("newsletter-form");
const newsletterEmail = document.getElementById("newsletter-email");
const newsletterStatus = document.getElementById("newsletter-status");
const topicPanel = document.getElementById("topic-panel");
const topicTitle = document.getElementById("topic-title");
const topicDescription = document.getElementById("topic-description");
const metaDescription = document.querySelector("meta[name='description']");

let currentTopic = "";
let latestBriefing = null;
let latestSearchArticles = [];
let hiddenSources = new Set(JSON.parse(localStorage.getItem("hiddenSources") || "[]"));
let preferredSources = new Set(JSON.parse(localStorage.getItem("preferredSources") || "[]"));
const savedEmail = localStorage.getItem("newsletterEmail");
const apiVersion = "2026-05-09-briefing-v2";
const newsRefreshMs = 10 * 60 * 1000;
const marketRefreshMs = 60 * 1000;
let lastNewsRefreshAt = 0;
let marketRefreshTimer;
let newsRefreshTimer;

if (savedEmail) {
  newsletterEmail.value = savedEmail;
  newsletterStatus.textContent = "You are on the prototype briefing list.";
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

function formatMarketValue(market) {
  const options =
    market.value > 100
      ? { maximumFractionDigits: 0 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 4 };
  const value = new Intl.NumberFormat("en-US", options).format(market.value);

  return `${market.currency || ""}${value}`;
}

function getVisibleArticles(articles) {
  return articles
    .filter((article) => !hiddenSources.has(article.source))
    .sort((first, second) => {
      const firstPreferred = preferredSources.has(first.source) ? 1 : 0;
      const secondPreferred = preferredSources.has(second.source) ? 1 : 0;
      return secondPreferred - firstPreferred;
    });
}

function saveHiddenSources() {
  localStorage.setItem("hiddenSources", JSON.stringify([...hiddenSources]));
}

function savePreferredSources() {
  localStorage.setItem("preferredSources", JSON.stringify([...preferredSources]));
}

function updateSourceControls() {
  const hidden = hiddenSources.size;
  const preferred = preferredSources.size;
  sourceControls.hidden = hidden === 0 && preferred === 0;
  hiddenCount.textContent = `${hidden} hidden · ${preferred} preferred`;
}

function humanizeTopic(topic) {
  return topic
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
    document.title = "SignalLedger Briefing";
    metaDescription.content =
      "A focused business, technology, markets, and world news briefing powered by Google News RSS.";
    return;
  }

  const copy = getTopicCopy(topic);
  topicPanel.hidden = false;
  topicTitle.textContent = copy.title;
  topicDescription.textContent = copy.description;
  document.title = `${copy.title} | SignalLedger`;
  metaDescription.content = copy.description;
}

function createCard(article) {
  const fragment = cardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".news-card");
  const logo = fragment.querySelector(".source-logo");
  const image = fragment.querySelector(".card-image");

  card.dataset.source = article.source;
  logo.src = article.imageUrl || "/favicon.svg";
  logo.alt = `${article.source} logo`;
  image.src = article.visualUrl || "/favicon.svg";
  image.alt = "";
  fragment.querySelector(".card-source").textContent = article.source;
  fragment.querySelector(".card-title").textContent = article.title;
  fragment.querySelector(".card-description").textContent =
    article.whyItMatters || article.description || "This story is developing.";
  fragment.querySelector(".card-date").textContent = formatDate(article.publishedAt);

  const clusterLabel = fragment.querySelector(".cluster-label");
  if (article.clusterCount > 1) {
    const sources = article.clusterSources?.slice(0, 3).join(", ");
    clusterLabel.textContent = `${article.clusterCount} sources tracking this: ${sources}`;
  } else {
    clusterLabel.remove();
  }

  const link = fragment.querySelector(".card-link");
  link.href = article.link;

  const preferButton = fragment.querySelector(".prefer-source-button");
  preferButton.textContent = preferredSources.has(article.source) ? "Preferred" : "Prefer source";
  preferButton.addEventListener("click", () => {
    if (preferredSources.has(article.source)) {
      preferredSources.delete(article.source);
    } else {
      preferredSources.add(article.source);
      hiddenSources.delete(article.source);
    }

    savePreferredSources();
    saveHiddenSources();
    rerenderCurrentView();
  });

  fragment.querySelector(".hide-source-button").addEventListener("click", () => {
    hiddenSources.add(article.source);
    preferredSources.delete(article.source);
    saveHiddenSources();
    savePreferredSources();
    rerenderCurrentView();
  });

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
  summary.textContent = article.whyItMatters || article.description || "This story is developing.";

  const link = document.createElement("a");
  link.className = "lead-link";
  link.href = article.link;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "Read the lead story";

  leadStory.append(source, title, summary, link);

  const panel = document.querySelector(".lead-panel");
  if (panel && article.visualUrl) {
    panel.style.backgroundImage = `linear-gradient(120deg, rgba(8, 63, 53, 0.92), rgba(20, 24, 23, 0.58)), url("${article.visualUrl}")`;
  }
}

function renderFastBriefing(articles) {
  briefingList.innerHTML = "";

  for (const article of getVisibleArticles(articles)) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = article.link;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = article.title;

    const meta = document.createElement("span");
    meta.textContent = `${article.source} · ${formatDate(article.publishedAt)}`;

    item.append(link, meta);
    briefingList.appendChild(item);
  }
}

function renderSections(sections) {
  sectionsContainer.innerHTML = "";

  for (const section of sections) {
    const block = document.createElement("section");
    block.className = "section-block";
    block.id = section.key;

    const heading = document.createElement("h2");
    heading.textContent = section.label;

    const grid = document.createElement("div");
    grid.className = "news-grid";
    renderArticleGrid(grid, getVisibleArticles(section.articles).slice(0, 4));

    block.append(heading, grid);
    sectionsContainer.appendChild(block);
  }
}

function renderMarkets(markets) {
  marketStrip.innerHTML = "";

  if (!markets?.length) {
    marketStatus.textContent = "Market data unavailable";
    return;
  }

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

  for (const market of markets) {
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

  if (currentTopic) {
    loadSearch(currentTopic);
    return;
  }

  loadBriefing();
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

function rerenderCurrentView() {
  updateSourceControls();

  if (latestBriefing) {
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
  statusText.textContent = "Loading briefing...";
  searchResults.innerHTML = "";
  latestSearchArticles = [];
  currentTopic = "";
  updateTopicExperience("");

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
    statusText.textContent = `Briefing updated ${formatDate(data.generatedAt)}`;
    setLastUpdated(data.generatedAt);
    updateSourceControls();
  } catch (error) {
    statusText.textContent = error.message;
  }
}

async function loadSearch(topic = "") {
  currentTopic = topic.trim();
  updateTopicExperience(currentTopic);
  statusText.textContent = "Searching...";
  searchResults.innerHTML = "";

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
    feedTitle.textContent = currentTopic ? `Search: ${currentTopic}` : "Search briefing";
    statusText.textContent = `${getVisibleArticles(data.articles).length} stories loaded`;
    setLastUpdated();
    renderArticleGrid(searchResults, getVisibleArticles(data.articles).slice(0, 8));
    updateSourceControls();
  } catch (error) {
    feedTitle.textContent = currentTopic || "Search briefing";
    statusText.textContent = error.message;
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const topic = topicInput.value.trim();
  if (topic) {
    window.history.pushState({}, "", `/topic/${encodeURIComponent(topic.toLowerCase().replace(/\s+/g, "-"))}`);
  }
  loadSearch(topicInput.value);
});

refreshButton.addEventListener("click", () => {
  if (currentTopic) {
    loadSearch(currentTopic);
    return;
  }

  loadBriefing();
});

resetSources.addEventListener("click", () => {
  hiddenSources = new Set();
  preferredSources = new Set();
  saveHiddenSources();
  savePreferredSources();
  rerenderCurrentView();
});

newsletterForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = newsletterEmail.value.trim();
  newsletterStatus.textContent = "Joining...";

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
    newsletterStatus.textContent = "You are on the prototype briefing list.";
  } catch (error) {
    newsletterStatus.textContent = error.message;
  }
});

window.addEventListener("popstate", () => {
  const topic = getTopicFromPath();
  if (topic) {
    topicInput.value = topic;
    loadSearch(topic);
    return;
  }

  loadBriefing();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    return;
  }

  loadMarkets();
  if (Date.now() - lastNewsRefreshAt > newsRefreshMs) {
    refreshCurrentNews();
  }
});

const initialTopic = getTopicFromPath();
if (initialTopic) {
  topicInput.value = initialTopic;
  loadBriefing().then(() => loadSearch(initialTopic));
} else {
  loadBriefing();
}
startAutoRefresh();
