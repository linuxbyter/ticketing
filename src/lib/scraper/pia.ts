import * as cheerio from "cheerio";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ja,en;q=0.9",
};

interface ScrapedEvent {
  title: string;
  venue: string;
  eventDate: string;
  imageUrl: string;
  sourceUrl: string;
}

export async function scrapePia(): Promise<ScrapedEvent[]> {
  try {
    const res = await fetch("https://t.pia.jp/music/", {
      headers: HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const events: ScrapedEvent[] = [];

    $("figure, div.card, div.pia-card, a[href*='/pia/']").each((_, el) => {
      const $el = $(el);
      const title = $el.find("h2, h3, figcaption h2").first().text().trim() || $el.text().trim().slice(0, 100);
      const dateStr = $el.find("span.date, time, figcaption span").first().text().trim();
      const venue = $el.find("span.venue").first().text().trim();
      const link = $el.attr("href") || $el.find("a").first().attr("href") || "";
      const fullUrl = link.startsWith("http") ? link : `https://t.pia.jp${link}`;
      const img = $el.find("img").first().attr("src") || "";

      if (title && title.length > 2) {
        events.push({
          title: title.slice(0, 200),
          venue,
          eventDate: dateStr,
          imageUrl: img,
          sourceUrl: fullUrl,
        });
      }
    });

    return events.slice(0, 10);
  } catch {
    return [];
  }
}
