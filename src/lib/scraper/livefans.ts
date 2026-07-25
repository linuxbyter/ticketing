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

export async function scrapeLivefans(): Promise<ScrapedEvent[]> {
  try {
    const res = await fetch("https://www.livefans.jp/search/", {
      headers: HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const events: ScrapedEvent[] = [];

    $("div.dataBlock, div.eventBlock, li.event-item, a[href*='/event/']").each((_, el) => {
      const $el = $(el);
      const title = $el.find("span.liveName, h3").first().text().trim() || $el.text().trim().slice(0, 100);
      const dateStr = $el.find("span.date, time").first().text().trim();
      const venue = $el.find("span.venue").first().text().trim();
      const link = $el.attr("href") || $el.find("a").first().attr("href") || "";
      const fullUrl = link.startsWith("http") ? link : `https://www.livefans.jp${link}`;

      if (title && title.length > 2) {
        events.push({
          title: title.slice(0, 200),
          venue,
          eventDate: dateStr,
          imageUrl: "",
          sourceUrl: fullUrl,
        });
      }
    });

    return events.slice(0, 10);
  } catch {
    return [];
  }
}
