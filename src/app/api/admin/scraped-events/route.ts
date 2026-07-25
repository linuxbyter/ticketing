import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapedEvents } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const events = await db
      .select()
      .from(scrapedEvents)
      .orderBy(desc(scrapedEvents.createdAt));
    return NextResponse.json(events);
  } catch (error) {
    console.error("Fetch scraped events error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
