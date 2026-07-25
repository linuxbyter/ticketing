import { db } from "@/lib/db";
import { scrapedEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { scrapeEplus } from "./eplus";
import { scrapeLivefans } from "./livefans";
import { scrapePia } from "./pia";

export interface ScrapedEvent {
  title: string;
  venue: string;
  eventDate: string;
  imageUrl: string;
  sourceUrl: string;
}

async function saveEvents(
  source: string,
  events: ScrapedEvent[]
): Promise<number> {
  let saved = 0;
  for (const event of events) {
    try {
      const existing = await db
        .select()
        .from(scrapedEvents)
        .where(eq(scrapedEvents.sourceUrl, event.sourceUrl))
        .limit(1);

      if (existing.length > 0) continue;

      await db.insert(scrapedEvents).values({
        source,
        sourceUrl: event.sourceUrl,
        title: event.title,
        venue: event.venue || null,
        eventDate: event.eventDate || null,
        imageUrl: event.imageUrl || null,
        status: "pending",
      });
      saved++;
    } catch {
      // skip duplicates or errors
    }
  }
  return saved;
}

export async function runScrapers(): Promise<{
  eplus: number;
  livefans: number;
  pia: number;
  total: number;
}> {
  const eplusResults = await scrapeEplus();
  const eplusSaved = await saveEvents("eplus", eplusResults);

  const livefansResults = await scrapeLivefans();
  const livefansSaved = await saveEvents("livefans", livefansResults);

  const piaResults = await scrapePia();
  const piaSaved = await saveEvents("pia", piaResults);

  return {
    eplus: eplusSaved,
    livefans: livefansSaved,
    pia: piaSaved,
    total: eplusSaved + livefansSaved + piaSaved,
  };
}
