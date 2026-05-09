const express = require("express");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");

const app = express();
const port = process.env.PORT || 3000;
const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
});

const sections = [
  { key: "business", label: "Business", query: "business" },
  { key: "tech", label: "Tech", query: "technology OR artificial intelligence" },
  { key: "markets", label: "Markets", query: "markets stocks economy" },
  { key: "world", label: "World", query: "world geopolitics" },
];

function stripHtml(value = "") {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildFeedUrl(topic) {
  if (!topic) {
    return "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en";
  }

  const query = encodeURIComponent(topic);
  return `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
}

function getItems(channel) {
  if (!channel?.item) {
    return [];
  }

  return Array.isArray(channel.item) ? channel.item : [channel.item];
}

function getArticleId(article) {
  return `${article.title}-${article.source}`.toLowerCase();
}

function getWhyItMatters(article, fallbackTopic) {
  const cleanDescription = stripHtml(article.description || "");
  const firstSentence = cleanDescription.split(/(?<=[.!?])\s+/)[0];

  if (firstSentence && firstSentence.length > 45) {
    return firstSentence.length > 180 ? `${firstSentence.slice(0, 177)}...` : firstSentence;
  }

  return `This is moving the ${fallbackTopic.toLowerCase()} conversation and is worth tracking today.`;
}

async function fetchArticles(topic, limit = 12) {
  const response = await fetch(buildFeedUrl(topic), {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Google News request failed with ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml);
  const channel = parsed?.rss?.channel;

  return getItems(channel)
    .slice(0, limit)
    .map((item) => {
      const article = {
        title: item.title || "Untitled article",
        link: item.link || "#",
        publishedAt: item.pubDate || "",
        source: item.source?.["#text"] || item.source || "Google News",
        description: stripHtml(item.description || ""),
      };

      return {
        ...article,
        whyItMatters: getWhyItMatters(article, topic || "Top stories"),
      };
    });
}

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/briefing", async (_req, res) => {
  try {
    const [topStories, ...sectionFeeds] = await Promise.all([
      fetchArticles("business technology markets geopolitics", 10),
      ...sections.map((section) => fetchArticles(section.query, 8)),
    ]);

    const seen = new Set();
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

    res.json({
      generatedAt: new Date().toISOString(),
      lead: topStories[0],
      fastBriefing: topStories.slice(1, 9),
      sections: sectionData,
    });
  } catch (error) {
    res.status(500).json({
      error: "Could not load the briefing right now.",
      details: error.message,
    });
  }
});

app.get("/api/news", async (req, res) => {
  try {
    const topic = typeof req.query.topic === "string" ? req.query.topic.trim() : "";
    const articles = await fetchArticles(topic, 12);

    res.json({
      topic: topic || "Top stories",
      articles,
    });
  } catch (error) {
    res.status(500).json({
      error: "Could not load Google News right now.",
      details: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
