import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapedEvents, events, ticketTiers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { parseEventWithAI } from "@/lib/ai/parse-event";

export async function POST(request: NextRequest) {
  try {
    const { scraped_event_id } = await request.json();

    if (!scraped_event_id) {
      return NextResponse.json(
        { error: "scraped_event_id is required" },
        { status: 400 }
      );
    }

    const [scraped] = await db
      .select()
      .from(scrapedEvents)
      .where(eq(scrapedEvents.id, scraped_event_id));

    if (!scraped) {
      return NextResponse.json(
        { error: "Scraped event not found" },
        { status: 404 }
      );
    }

    if (scraped.status !== "pending") {
      return NextResponse.json(
        { error: `Event is already ${scraped.status}` },
        { status: 400 }
      );
    }

    const parsed = await parseEventWithAI({
      title: scraped.title,
      venue: scraped.venue || "",
      eventDate: scraped.eventDate || "",
      imageUrl: scraped.imageUrl || "",
    });

    const [event] = await db
      .insert(events)
      .values({
        titleJa: parsed.title_ja,
        titleEn: parsed.title_en,
        titleZh: parsed.title_zh,
        descriptionJa: parsed.description_ja || null,
        venue: parsed.venue,
        eventDate: new Date(parsed.event_date),
        imageUrl: parsed.image_url || null,
        status: "active",
      })
      .returning();

    if (parsed.suggested_tiers && parsed.suggested_tiers.length > 0) {
      await db.insert(ticketTiers).values(
        parsed.suggested_tiers.map((t) => ({
          eventId: event.id,
          nameJa: t.name_ja,
          nameEn: t.name_en,
          nameZh: t.name_zh,
          price: String(t.price),
          quantityTotal: t.quantity_total,
        }))
      );
    }

    await db
      .update(scrapedEvents)
      .set({ status: "created" })
      .where(eq(scrapedEvents.id, scraped_event_id));

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Approve scraped event error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
