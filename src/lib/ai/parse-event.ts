import OpenAI from "openai";

function getClient() {
  return new OpenAI({
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKey: process.env.NVIDIA_API_KEY,
  });
}

interface ParsedEvent {
  title_ja: string;
  title_en: string;
  title_zh: string;
  description_ja: string;
  venue: string;
  event_date: string;
  image_url: string;
  suggested_tiers: { name_ja: string; name_en: string; name_zh: string; price: number; quantity_total: number }[];
}

export async function parseEventWithAI(raw: {
  title: string;
  venue: string;
  eventDate: string;
  imageUrl: string;
}): Promise<ParsedEvent> {
  const client = getClient();

  const prompt = `Parse this Japanese event data into structured fields. Return ONLY valid JSON, no other text.

Input:
- Title: ${raw.title}
- Venue: ${raw.venue}
- Date: ${raw.eventDate}
- Image: ${raw.imageUrl}

Return JSON with these fields:
{
  "title_ja": "original Japanese title",
  "title_en": "English translation of the title",
  "title_zh": "Chinese translation of the title",
  "description_ja": "short description in Japanese (1-2 sentences about the event)",
  "venue": "cleaned venue name",
  "event_date": "ISO 8601 date string (YYYY-MM-DDTHH:mm:ss)",
  "image_url": "${raw.imageUrl}",
  "suggested_tiers": [
    {"name_ja": "一般", "name_en": "General", "name_zh": "普通", "price": 5000, "quantity_total": 200},
    {"name_ja": "VIP", "name_en": "VIP", "name_zh": "VIP", "price": 15000, "quantity_total": 50}
  ]
}

Rules:
- If date is unclear, use a reasonable future date
- Suggest 2-3 ticket tiers with prices in JPY
- Keep translations natural, not literal
- If image_url is empty, keep it as empty string`;

  const completion = await client.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "nvidia/nemotron-3-ultra-550b-a55b",
    temperature: 0.3,
    max_tokens: 1024,
  });

  const content = completion.choices[0]?.message?.content || "{}";

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI returned invalid JSON");
  }

  return JSON.parse(jsonMatch[0]) as ParsedEvent;
}
