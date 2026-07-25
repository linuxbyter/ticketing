import * as cheerio from "cheerio";

const BASE_URL = "https://eplus.jp";
const SITEMAP_URL = "https://eplus.jp/s/eplus.jp/sitemap_weekly.xml";
const DELAY_MS = 20000;

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

async function parseSitemap(): Promise<string[]> {
  const xml = await fetchWithRetry(SITEMAP_URL);
  if (!xml) return [];

  const urls: string[] = [];
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1];
    if (url.includes("/sf/detail/")) {
      urls.push(url);
    }
  }
  return urls.slice(0, 30);
}

async function scrapeEventPage(url: string): Promise<ScrapedEvent | null> {
  const html = await fetchWithRetry(url);
  if (!html) return null;

  const $ = cheerio.load(html);

  const title =
    $("h1.ticket-item__title").first().text().trim() ||
    $("h2").first().text().trim() ||
    $("title").text().split("|")[0].trim();

  const venue =
    $("span.ticket-item__venue p").first().text().trim() ||
    $(".venue-name").first().text().trim();

  const year = $("span.ticket-item__yyyy").first().text().trim();
  const mmdd = $("span.ticket-item__mmdd").first().text().trim();
  const eventDate = year && mmdd ? `${year} ${mmdd}` : "";

  const imageUrl =
    $("img.ticket-item__image").attr("src") ||
    $('meta[property="og:image"]').attr("content") ||
    "";

  if (!title) return null;

  return {
    title,
    venue,
    eventDate,
    imageUrl: imageUrl.startsWith("http")
      ? imageUrl
      : imageUrl
        ? `${BASE_URL}${imageUrl}`
        : "",
    sourceUrl: url,
  };
}

export async function scrapeEplus(): Promise<ScrapedEvent[]> {
  const results: ScrapedEvent[] = [];
  const urls = await parseSitemap();

  for (const url of urls) {
    const event = await scrapeEventPage(url);
    if (event) results.push(event);
    await sleep(DELAY_MS);
  }

  return results;
}
