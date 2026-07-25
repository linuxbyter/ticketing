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

export async function scrapeEplus(): Promise<ScrapedEvent[]> {
  try {
    const res = await fetch("https://eplus.jp/sf/event/", {
      headers: HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const events: ScrapedEvent[] = [];

    $("a[href*='/sf/detail/']").each((_, el) => {
      const $el = $(el);
      const title = $el.find("h3, h2").first().text().trim() || $el.text().trim().slice(0, 100);
      const venue = $el.find(".ticket-item__venue, .venue").first().text().trim();
      const link = $el.attr("href") || "";
      const fullUrl = link.startsWith("http") ? link : `https://eplus.jp${link}`;

      if (title && title.length > 2) {
        events.push({
          title: title.slice(0, 200),
          venue,
          eventDate: "",
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
