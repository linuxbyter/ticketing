import { NextResponse } from "next/server";
import { runScrapers } from "@/lib/scraper";

export async function GET() {
  try {
    const result = await runScrapers();
    return NextResponse.json({
      success: true,
      scraped: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Scrape cron error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
