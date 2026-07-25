import * as cheerio from "cheerio";

const BASE_URL = "https://www.livefans.jp";
const SEARCH_URL = `${BASE_URL}/search/`;
const DELAY_MS = 15000;

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

async function scrapeSearchPage(page: number): Promise<ScrapedEvent[]> {
  const url = page === 1 ? SEARCH_URL : `${SEARCH_URL}page:${page}`;
  const html = await fetchWithRetry(url);
  if (!html) return [];

  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];

  $("div.dataBlock, div.eventBlock, li.event-item").each((_, el) => {
    const $el = $(el);
    const title =
      $el.find("span.liveName, h3.event-name, a.event-title").first().text().trim();
    const dateStr =
      $el.find("span.date, span.event-date, time").first().text().trim();
    const venue =
      $el.find("span.venue, span.venue-name, div.venue").first().text().trim();
    const link =
      $el.find("a").first().attr("href") || "";
    const imageUrl =
      $el.find("img").first().attr("src") || "";

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

export async function scrapeLivefans(): Promise<ScrapedEvent[]> {
  const results: ScrapedEvent[] = [];

  for (let page = 1; page <= 3; page++) {
    const events = await scrapeSearchPage(page);
    results.push(...events);
    await sleep(DELAY_MS);
  }

  return results;
}
