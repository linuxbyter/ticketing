import { NextRequest, NextResponse } from "next/server";
import { chatWithAgent } from "@/lib/ai/nvidia";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const response = await chatWithAgent(messages);

    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process AI request" },
      { status: 500 }
    );
  }
}
