import { NextResponse } from "next/server";
import { runScrapers } from "@/lib/scraper";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
