import * as cheerio from "cheerio";

const BASE_URL = "https://t.pia.jp";
const MUSIC_URL = `${BASE_URL}/music/`;
const EVENT_URL = `${BASE_URL}/event/`;
const DELAY_MS = 3000;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ja,en;q=0.9",
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ScrapedEvent {
  title: string;
  venue: string;
  eventDate: string;
  imageUrl: string;
  sourceUrl: string;
}

async function fetchWithRetry(
  url: string,
  retries = 3
): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) return null;
      return await res.text();
    } catch {
      if (i < retries - 1) await sleep(5000);
    }
  }
  return null;
}

async function scrapeSection(url: string): Promise<ScrapedEvent[]> {
  const html = await fetchWithRetry(url);
  if (!html) return [];

  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];

  $(
    "div.pia-card, div.event-card, figure, div.card, li.event-item"
  ).each((_, el) => {
    const $el = $(el);
    const title =
      $el.find("h2, h3, figcaption h2, figcaption h3, a.card-title").first().text().trim();
    const dateStr =
      $el.find("span.date, span.event-date, figcaption span, time")
        .first()
        .text()
        .trim();
    const venue =
      $el.find("span.venue, span.venue-name, div.venue").first().text().trim();
    const link = $el.find("a").first().attr("href") || "";
    const imageUrl =
      $el.find("img").first().attr("src") ||
      $el.find("img").first().attr("data-src") ||
      "";

    if (title) {
      const fullUrl = link.startsWith("http") ? link : `${BASE_URL}${link}`;
      events.push({
        title,
        venue,
        eventDate: dateStr,
        imageUrl: imageUrl.startsWith("http")
          ? imageUrl
          : imageUrl
            ? `${BASE_URL}${imageUrl}`
            : "",
        sourceUrl: fullUrl,
      });
    }
  });

  return events;
}

export async function scrapePia(): Promise<ScrapedEvent[]> {
  const musicEvents = await scrapeSection(MUSIC_URL);
  await sleep(DELAY_MS);
  const generalEvents = await scrapeSection(EVENT_URL);

  return [...musicEvents, ...generalEvents];
}
