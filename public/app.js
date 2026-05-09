const searchResults = document.getElementById("search-results");
const sectionsContainer = document.getElementById("sections");
const statusText = document.getElementById("status");
const feedTitle = document.getElementById("feed-title");
const searchForm = document.getElementById("search-form");
const topicInput = document.getElementById("topic-input");
const refreshButton = document.getElementById("refresh-button");
const cardTemplate = document.getElementById("card-template");
const leadStory = document.getElementById("lead-story");
const briefingList = document.getElementById("briefing-list");
const marketStrip = document.getElementById("market-strip");
const marketStatus = document.getElementById("market-status");
const sourceControls = document.getElementById("source-controls");
const hiddenCount = document.getElementById("hidden-count");
const resetSources = document.getElementById("reset-sources");

let currentTopic = "";
let latestBriefing = null;
let latestSearchArticles = [];
let hiddenSources = new Set(JSON.parse(localStorage.getItem("hiddenSources") || "[]"));

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

function formatMarketValue(market) {
  const options =
    market.value > 100
      ? { maximumFractionDigits: 0 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 4 };
  const value = new Intl.NumberFormat("en-US", options).format(market.value);

  return `${market.currency || ""}${value}`;
}

function getVisibleArticles(articles) {
  return articles.filter((article) => !hiddenSources.has(article.source));
}

function saveHiddenSources() {
  localStorage.setItem("hiddenSources", JSON.stringify([...hiddenSources]));
}

function updateSourceControls() {
  const count = hiddenSources.size;
  sourceControls.hidden = count === 0;
  hiddenCount.textContent = count === 1 ? "1 source hidden" : `${count} sources hidden`;
}

function createCard(article) {
  const fragment = cardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".news-card");
  const logo = fragment.querySelector(".source-logo");

  card.dataset.source = article.source;
  logo.src = article.imageUrl || "/favicon.svg";
  logo.alt = `${article.source} logo`;
  fragment.querySelector(".card-source").textContent = article.source;
  fragment.querySelector(".card-title").textContent = article.title;
  fragment.querySelector(".card-description").textContent =
    article.whyItMatters || article.description || "This story is developing.";
  fragment.querySelector(".card-date").textContent = formatDate(article.publishedAt);

  const link = fragment.querySelector(".card-link");
  link.href = article.link;

  fragment.querySelector(".hide-source-button").addEventListener("click", () => {
    hiddenSources.add(article.source);
    saveHiddenSources();
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

  marketStatus.textContent = latestUpdate ? `Updated ${formatDate(latestUpdate)}` : "Live data";

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

    card.append(label, value, change);
    marketStrip.appendChild(card);
  }
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

  try {
    const response = await fetch("/api/briefing");
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
    updateSourceControls();
  } catch (error) {
    statusText.textContent = error.message;
  }
}

async function loadSearch(topic = "") {
  currentTopic = topic.trim();
  statusText.textContent = "Searching...";
  searchResults.innerHTML = "";

  const params = new URLSearchParams();
  if (currentTopic) {
    params.set("topic", currentTopic);
  }

  try {
    const response = await fetch(`/api/news?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || data.error || "Unknown error");
    }

    latestSearchArticles = data.articles;
    feedTitle.textContent = currentTopic ? `Search: ${currentTopic}` : "Search briefing";
    statusText.textContent = `${getVisibleArticles(data.articles).length} stories loaded`;
    renderArticleGrid(searchResults, getVisibleArticles(data.articles).slice(0, 8));
    updateSourceControls();
  } catch (error) {
    feedTitle.textContent = currentTopic || "Search briefing";
    statusText.textContent = error.message;
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
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
  saveHiddenSources();
  rerenderCurrentView();
});

loadBriefing();
