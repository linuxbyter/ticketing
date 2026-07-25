import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapedEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { scraped_event_id } = await request.json();

    if (!scraped_event_id) {
      return NextResponse.json(
        { error: "scraped_event_id is required" },
        { status: 400 }
      );
    }

    await db
      .update(scrapedEvents)
      .set({ status: "ignored" })
      .where(eq(scrapedEvents.id, scraped_event_id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ignore scraped event error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
