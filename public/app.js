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

let currentTopic = "";

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

function createCard(article) {
  const fragment = cardTemplate.content.cloneNode(true);
  fragment.querySelector(".card-source").textContent = article.source;
  fragment.querySelector(".card-title").textContent = article.title;
  fragment.querySelector(".card-description").textContent =
    article.whyItMatters || article.description || "This story is developing.";
  fragment.querySelector(".card-date").textContent = formatDate(article.publishedAt);

  const link = fragment.querySelector(".card-link");
  link.href = article.link;

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
  source.append(article.source, " ");

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

  for (const article of articles) {
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
    renderArticleGrid(grid, section.articles.slice(0, 4));

    block.append(heading, grid);
    sectionsContainer.appendChild(block);
  }
}

async function loadBriefing() {
  statusText.textContent = "Loading briefing...";
  searchResults.innerHTML = "";

  try {
    const response = await fetch("/api/briefing");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || data.error || "Unknown error");
    }

    renderLead(data.lead);
    renderFastBriefing(data.fastBriefing);
    renderSections(data.sections);
    statusText.textContent = `Briefing updated ${formatDate(data.generatedAt)}`;
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

    feedTitle.textContent = currentTopic ? `Search: ${currentTopic}` : "Search briefing";
    statusText.textContent = `${data.articles.length} stories loaded`;
    renderArticleGrid(searchResults, data.articles.slice(0, 8));
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

loadBriefing();
