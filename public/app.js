const searchResults = document.getElementById("search-results");
const statusText = document.getElementById("status");
const cardTemplate = document.getElementById("card-template");
const topicTitle = document.getElementById("topic-title");
const topicDescription = document.getElementById("topic-description");
const editorialBrief = document.getElementById("editorial-brief");
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
const privacyView = document.getElementById("privacy-view");
const termsView = document.getElementById("terms-view");
const contactView = document.getElementById("contact-view");
const todaySummary = document.getElementById("today-summary");
const todayLead = document.getElementById("today-lead");
const todayGrid = document.getElementById("today-grid");
const navLinks = document.querySelectorAll("[data-nav]");

const apiVersion = "2026-05-31-compact-cards-v1";
const siteUrl = "https://kreativtools.com";
const siteName = "KreativTools";
const defaultDescription = "A fast business briefing for markets, technology, Europe, and Romania.";
const fixedTopics = [
  {
    topic: "artificial intelligence",
    slug: "artificial-intelligence",
    title: "AI Briefing",
    description: "AI regulation, model launches, chip supply, enterprise adoption, and companies shaping the market.",
  },
  {
    topic: "markets",
    slug: "markets",
    title: "Markets Briefing",
    description: "Market-moving headlines across equities, rates, crypto, commodities, and macro policy.",
  },
  {
    topic: "romania",
    slug: "romania",
    title: "Romania Briefing",
    description: "Romanian business, technology, politics, and regional economy stories in a wider European context.",
  },
  {
    topic: "europe",
    slug: "europe",
    title: "Europe Briefing",
    description: "European business, policy, markets, and geopolitics with emphasis on decisions that shape the region.",
  },
];
const fixedTopicBySlug = new Map(fixedTopics.map((topic) => [topic.slug, topic]));

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

function slugifyTopic(topic = "") {
  return topic
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanTitle(title = "") {
  return title.replace(/\s[-|]\s[^-|]+$/, "").trim() || title;
}

function getFixedTopic(topic = "") {
  return fixedTopicBySlug.get(slugifyTopic(topic));
}

function updateTopicExperience(topicConfig) {
  topicTitle.textContent = topicConfig.title;
  topicDescription.textContent = topicConfig.description;

  const path = `/topic/${topicConfig.slug}`;
  setPageMeta(`${topicConfig.title} | ${siteName}`, topicConfig.description, { path });
  setStructuredData({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${topicConfig.title} | ${siteName}`,
    description: topicConfig.description,
    url: getAbsoluteUrl(path),
  });
}

function getLegalRouteCopy(type) {
  const copy = {
    privacy: {
      title: `Privacy Policy | ${siteName}`,
      description: "How KreativTools handles site data, analytics, advertising, and cookies.",
      path: "/privacy",
      schemaType: "PrivacyPolicy",
    },
    terms: {
      title: `Terms of Use | ${siteName}`,
      description: "Terms for using KreativTools briefings and market context.",
      path: "/terms",
      schemaType: "WebPage",
    },
    contact: {
      title: `Contact | ${siteName}`,
      description: "Contact KreativTools for corrections, source questions, advertising questions, and privacy requests.",
      path: "/contact",
      schemaType: "ContactPage",
    },
  };

  return copy[type];
}

function updateActiveNavigation() {
  const route = getRoute();
  let activeKey = "";

  if (route.type === "today" || route.type === "home") {
    activeKey = "today";
  } else if (route.type === "about") {
    activeKey = "about";
  } else if (route.type === "topic") {
    activeKey = getFixedTopic(route.topic)?.slug || "";
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
  privacyView.hidden = viewName !== "privacy";
  termsView.hidden = viewName !== "terms";
  contactView.hidden = viewName !== "contact";
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

function renderEditorialBrief(brief) {
  editorialBrief.innerHTML = "";

  if (!brief) {
    editorialBrief.hidden = true;
    return;
  }

  editorialBrief.hidden = false;

  const label = document.createElement("p");
  label.className = "section-label";
  label.textContent = "Start here";

  const title = document.createElement("h2");
  title.textContent = brief.title || "What matters today";

  const summary = document.createElement("p");
  summary.textContent = brief.summary || "";

  const list = document.createElement("ul");
  for (const item of (brief.signals || []).slice(0, 4)) {
    const point = document.createElement("li");
    point.textContent = item;
    list.appendChild(point);
  }

  editorialBrief.append(label, title, summary);
  if (list.children.length) {
    editorialBrief.appendChild(list);
  }
}

function renderThumbnail(thumbnail, article, element) {
  const meta = thumbnail || {};
  const tone = meta.tone || "signal";
  const variant = Number.isInteger(meta.variant) ? meta.variant : 0;

  element.dataset.tone = tone;
  element.dataset.variant = String(variant);
  element.querySelector(".thumbnail-label").textContent = meta.label || "Signal";
  element.querySelector(".thumbnail-initials").textContent =
    meta.initials || (article.source || "SL").slice(0, 2).toUpperCase();
}

function createCard(article) {
  const fragment = cardTemplate.content.cloneNode(true);
  const thumbnail = fragment.querySelector(".card-thumbnail");
  const originalLink = fragment.querySelector(".card-link");

  fragment.querySelector(".news-card").dataset.source = article.source || "";
  renderThumbnail(article.thumbnail, article, thumbnail);
  fragment.querySelector(".card-source").textContent = article.source || "Source";
  fragment.querySelector(".card-title").textContent = cleanTitle(article.title || "Untitled story");
  fragment.querySelector(".card-description").textContent = article.description || "This story is developing.";
  fragment.querySelector(".card-date").textContent = formatDate(article.publishedAt);

  if (article.link) {
    originalLink.href = article.link;
    originalLink.target = "_blank";
    originalLink.rel = "noreferrer";
    originalLink.textContent = "Read original";
  } else {
    originalLink.hidden = true;
  }

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

  if (window.location.pathname === "/privacy") {
    return { type: "privacy" };
  }

  if (window.location.pathname === "/terms") {
    return { type: "terms" };
  }

  if (window.location.pathname === "/contact") {
    return { type: "contact" };
  }

  const topic = getTopicFromPath();
  if (topic) {
    return { type: "topic", topic };
  }

  return { type: "home" };
}

async function loadTopic(topicConfig) {
  showView("topic");
  updateTopicExperience(topicConfig);
  updateActiveNavigation();
  setStatus("Loading topic briefing...");
  renderSkeletonGrid(searchResults, 6);

  const params = new URLSearchParams({
    topic: topicConfig.topic,
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
    renderErrorPanel(searchResults, error.message, () => loadTopic(topicConfig));
  }
}

async function loadTodayBriefing() {
  showView("today");
  updateActiveNavigation();
  setPageMeta(
    `${siteName} Briefing`,
    "A fast business briefing for markets, technology, Europe, and Romania.",
    {
      path: "/",
    },
  );
  setStructuredData({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${siteName} Briefing`,
    description: "A fast business briefing for markets, technology, Europe, and Romania.",
    url: getAbsoluteUrl("/"),
  });
  todaySummary.textContent = "Loading the latest briefing...";
  renderEditorialBrief(null);
  renderSkeletonGrid(todayGrid, 6);
  renderSkeletonGrid(todayLead, 1);

  try {
    const response = await fetch(`/api/briefing?v=${apiVersion}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || data.error || "Unknown error");
    }

    renderTodayBriefing(data);
    renderEditorialBrief(data.editorialBrief);
  } catch (error) {
    todaySummary.textContent = error.message;
    renderEditorialBrief(null);
    renderErrorPanel(todayGrid, error.message, loadTodayBriefing);
  }
}

function loadAbout() {
  showView("about");
  updateActiveNavigation();
  setPageMeta(
    `About ${siteName}`,
    "A quick way to scan the business day across markets, technology, Europe, and Romania.",
    {
      path: "/about",
    },
  );
  setStructuredData({
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About ${siteName}`,
    description: "A quick way to scan the business day across markets, technology, Europe, and Romania.",
    url: getAbsoluteUrl("/about"),
  });
}

async function loadLegal(type) {
  const copy = getLegalRouteCopy(type);
  if (!copy) {
    window.history.replaceState({}, "", "/");
    await loadTodayBriefing();
    return;
  }

  showView(type);
  updateActiveNavigation();
  setPageMeta(copy.title, copy.description, { path: copy.path });
  setStructuredData({
    "@context": "https://schema.org",
    "@type": copy.schemaType,
    name: copy.title,
    description: copy.description,
    url: getAbsoluteUrl(copy.path),
  });
}

async function loadRoute() {
  const route = getRoute();

  if (route.type === "about") {
    loadAbout();
    return;
  }

  if (["privacy", "terms", "contact"].includes(route.type)) {
    await loadLegal(route.type);
    return;
  }

  if (route.type === "topic") {
    const topicConfig = getFixedTopic(route.topic);

    if (!topicConfig) {
      window.history.replaceState({}, "", "/");
      await loadTodayBriefing();
      return;
    }

    await loadTopic(topicConfig);
    return;
  }

  await loadTodayBriefing();
}

window.addEventListener("popstate", loadRoute);
window.addEventListener("hashchange", updateActiveNavigation);

loadRoute();
