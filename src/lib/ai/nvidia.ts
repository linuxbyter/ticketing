import OpenAI from "openai";
import { db } from "@/lib/db";
import { orders, events, tickets, ticketTiers, payments, scrapedEvents } from "@/lib/db/schema";
import { eq, sql, count, sum } from "drizzle-orm";
import { runScrapers } from "@/lib/scraper";
import { parseEventWithAI } from "./parse-event";

function getClient() {
  return new OpenAI({
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKey: process.env.NVIDIA_API_KEY,
  });
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AgentTool {
  name: string;
  description: string;
  execute: (args: Record<string, string>) => Promise<string>;
}

const tools: AgentTool[] = [
  {
    name: "get_stats",
    description: "Get overall statistics: total orders, revenue, tickets sold, pending approvals",
    execute: async () => {
      try {
        const [totalOrders] = await db.select({ value: count() }).from(orders);
        const [pending] = await db.select({ value: count() }).from(orders).where(eq(orders.status, "pending_approval"));
        const [completed] = await db.select({ value: count() }).from(orders).where(eq(orders.status, "completed"));
        const [revenue] = await db.select({ value: sum(orders.totalAmount) }).from(orders).where(sql`${orders.status} IN ('approved', 'completed')`);
        const [ticketsSold] = await db.select({ value: count() }).from(tickets).where(eq(tickets.status, "sold"));

        return JSON.stringify({
          total_orders: totalOrders?.value ?? 0,
          pending: pending?.value ?? 0,
          completed: completed?.value ?? 0,
          revenue: revenue?.value ?? "0",
          tickets_sold: ticketsSold?.value ?? 0,
        }, null, 2);
      } catch (e) {
        return `Error: ${e instanceof Error ? e.message : "Unknown error"}`;
      }
    },
  },
  {
    name: "list_pending_orders",
    description: "List all orders with pending_approval status",
    execute: async () => {
      try {
        const pending = await db.select().from(orders).where(eq(orders.status, "pending_approval"));
        if (pending.length === 0) return "承認待ちの注文はありません。";
        return JSON.stringify(pending.map(o => ({
          id: o.id,
          customer: o.customerName,
          email: o.customerEmail,
          amount: o.totalAmount,
          created: o.createdAt,
        })), null, 2);
      } catch (e) {
        return `Error: ${e instanceof Error ? e.message : "Unknown error"}`;
      }
    },
  },
  {
    name: "list_events",
    description: "List all events",
    execute: async () => {
      try {
        const allEvents = await db.select().from(events);
        if (allEvents.length === 0) return "イベントはありません。";
        return JSON.stringify(allEvents.map(e => ({
          id: e.id,
          title: e.titleJa,
          venue: e.venue,
          date: e.eventDate,
          status: e.status,
        })), null, 2);
      } catch (e) {
        return `Error: ${e instanceof Error ? e.message : "Unknown error"}`;
      }
    },
  },
  {
    name: "approve_order",
    description: "Approve an order by its ID. This marks payment as verified.",
    execute: async (args) => {
      try {
        const orderId = args.order_id;
        const [existing] = await db.select().from(orders).where(eq(orders.id, orderId));
        if (!existing) return `注文 ${orderId} が見つかりません。`;
        if (existing.status !== "pending_approval") return `注文 ${orderId} は既に${existing.status}です。`;

        await db.update(orders).set({ status: "approved", approvedAt: new Date() }).where(eq(orders.id, orderId));
        await db.update(payments).set({ status: "verified" }).where(eq(payments.orderId, orderId));
        return `注文 ${orderId} (${existing.customerName}) を承認しました。金額: ¥${existing.totalAmount}`;
      } catch (e) {
        return `Error: ${e instanceof Error ? e.message : "Unknown error"}`;
      }
    },
  },
  {
    name: "reject_order",
    description: "Reject an order by its ID.",
    execute: async (args) => {
      try {
        const orderId = args.order_id;
        const [existing] = await db.select().from(orders).where(eq(orders.id, orderId));
        if (!existing) return `注文 ${orderId} が見つかりません。`;

        await db.update(orders).set({ status: "rejected" }).where(eq(orders.id, orderId));
        await db.update(payments).set({ status: "rejected" }).where(eq(payments.orderId, orderId));
        return `注文 ${orderId} (${existing.customerName}) を却下しました。`;
      } catch (e) {
        return `Error: ${e instanceof Error ? e.message : "Unknown error"}`;
      }
    },
  },
  {
    name: "create_event",
    description: "Create a new event with ticket tiers. Pass event_data as a JSON string with keys: title_ja, title_en, title_zh, venue, event_date (ISO string), and optional: description_ja, description_en, description_zh, address, image_url, tiers (array of {name_ja, name_en, name_zh, price, quantity_total}).",
    execute: async (args) => {
      try {
        const data = JSON.parse(args.event_data);

        if (!data.title_ja || !data.title_en || !data.title_zh || !data.venue || !data.event_date) {
          return "エラー: 必須フィールドが不足しています (title_ja, title_en, title_zh, venue, event_date)";
        }

        const [event] = await db
          .insert(events)
          .values({
            titleJa: data.title_ja,
            titleEn: data.title_en,
            titleZh: data.title_zh,
            descriptionJa: data.description_ja || null,
            descriptionEn: data.description_en || null,
            descriptionZh: data.description_zh || null,
            venue: data.venue,
            address: data.address || null,
            eventDate: new Date(data.event_date),
            imageUrl: data.image_url || null,
            status: "active",
          })
          .returning();

        if (data.tiers && Array.isArray(data.tiers) && data.tiers.length > 0) {
          await db.insert(ticketTiers).values(
            data.tiers.map((t: Record<string, unknown>) => ({
              eventId: event.id,
              nameJa: t.name_ja as string,
              nameEn: t.name_en as string,
              nameZh: t.name_zh as string,
              price: String(t.price),
              quantityTotal: t.quantity_total as number,
            }))
          );
        }

        return `イベント「${data.title_ja}」を作成しました！\nID: ${event.id}\n会場: ${data.venue}\n日時: ${data.event_date}\nチケット tier数: ${data.tiers?.length ?? 0}`;
      } catch (e) {
        return `Error: ${e instanceof Error ? e.message : "Unknown error"}`;
      }
    },
  },
  {
    name: "scrape_events_now",
    description: "Trigger immediate scrape of Japanese event sites (eplus, livefans, pia). Returns count of new events found.",
    execute: async () => {
      try {
        const result = await runScrapers();
        return `スクレイピング完了！\neplus: ${result.eplus}件\nlivefans: ${result.livefans}件\npia: ${result.pia}件\n合計: ${result.total}件の新しいイベントを発見しました。`;
      } catch (e) {
        return `Error: ${e instanceof Error ? e.message : "Unknown error"}`;
      }
    },
  },
  {
    name: "list_scraped_events",
    description: "List pending scraped events waiting for approval",
    execute: async () => {
      try {
        const pending = await db.select().from(scrapedEvents).where(eq(scrapedEvents.status, "pending"));
        if (pending.length === 0) return "承認待ちのスクレイピングイベントはありません。";
        return JSON.stringify(pending.map(e => ({
          id: e.id,
          title: e.title,
          venue: e.venue,
          date: e.eventDate,
          source: e.source,
          url: e.sourceUrl,
        })), null, 2);
      } catch (e) {
        return `Error: ${e instanceof Error ? e.message : "Unknown error"}`;
      }
    },
  },
  {
    name: "approve_scraped_event",
    description: "Approve a scraped event and create it in the database. Provide the scraped_event_id.",
    execute: async (args) => {
      try {
        const scrapedId = args.scraped_event_id;
        const [scraped] = await db.select().from(scrapedEvents).where(eq(scrapedEvents.id, scrapedId));
        if (!scraped) return `スクレイピングイベント ${scrapedId} が見つかりません。`;
        if (scraped.status !== "pending") return `このイベントは既に${scraped.status}です。`;

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
            parsed.suggested_tiers.map(t => ({
              eventId: event.id,
              nameJa: t.name_ja,
              nameEn: t.name_en,
              nameZh: t.name_zh,
              price: String(t.price),
              quantityTotal: t.quantity_total,
            }))
          );
        }

        await db.update(scrapedEvents).set({ status: "created" }).where(eq(scrapedEvents.id, scrapedId));

        return `イベント「${parsed.title_ja}」を作成しました！\nID: ${event.id}\n会場: ${parsed.venue}\n日時: ${parsed.event_date}\nチケット tier数: ${parsed.suggested_tiers?.length ?? 0}`;
      } catch (e) {
        return `Error: ${e instanceof Error ? e.message : "Unknown error"}`;
      }
    },
  },
];

const SYSTEM_PROMPT = `You are an AI agent for Kippo🌸, a Japanese ticketing platform. You have direct access to the database and can perform actions.

CAPABILITIES:
- View statistics and analytics
- List pending orders
- List events
- Approve or reject orders
- Create new events with ticket tiers
- Scrape events from Japanese ticket sites (eplus, livefans, pia)
- Manage scraped events (list, approve, create from)

AVAILABLE TOOLS:
- get_stats: Get dashboard statistics
- list_pending_orders: Show orders waiting for approval
- list_events: Show all events
- approve_order: Approve an order (provide order_id)
- reject_order: Reject an order (provide order_id)
- create_event: Create a new event (provide event_data as JSON)
- scrape_events_now: Trigger immediate scrape of event sites
- list_scraped_events: Show pending scraped events
- approve_scraped_event: Approve a scraped event and create it (provide scraped_event_id)

RULES:
- Always respond in Japanese unless the user writes in another language
- When performing destructive actions (reject), confirm with the user first
- Show results in a readable format
- Be concise and helpful

DATABASE SCHEMA:
- events: id, title_ja, title_en, title_zh, description_ja, description_en, description_zh, venue, address, event_date, image_url, status
- orders: id, customer_name, customer_email, status, total_amount, created_at, approved_at
- tickets: id, event_id, tier_id, ticket_code, status
- ticket_tiers: id, event_id, name_ja, name_en, name_zh, price, quantity_total, quantity_sold
- payments: id, order_id, method, amount, status
- scraped_events: id, source, source_url, title, venue, event_date, image_url, status`;

const NVIDIA_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_stats",
      description: "Get dashboard statistics",
      parameters: { type: "object" as const, properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_pending_orders",
      description: "List all orders with pending_approval status",
      parameters: { type: "object" as const, properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_events",
      description: "List all events",
      parameters: { type: "object" as const, properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "approve_order",
      description: "Approve an order by its ID",
      parameters: {
        type: "object" as const,
        properties: {
          order_id: { type: "string", description: "The order ID to approve" },
        },
        required: ["order_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "reject_order",
      description: "Reject an order by its ID",
      parameters: {
        type: "object" as const,
        properties: {
          order_id: { type: "string", description: "The order ID to reject" },
        },
        required: ["order_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_event",
      description: "Create a new event with ticket tiers",
      parameters: {
        type: "object" as const,
        properties: {
          event_data: {
            type: "string",
            description: 'JSON string with event details: {title_ja, title_en, title_zh, venue, event_date (ISO), description_ja?, description_en?, description_zh?, address?, image_url?, tiers?: [{name_ja, name_en, name_zh, price, quantity_total}]}',
          },
        },
        required: ["event_data"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "scrape_events_now",
      description: "Trigger immediate scrape of Japanese event sites",
      parameters: { type: "object" as const, properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_scraped_events",
      description: "List pending scraped events waiting for approval",
      parameters: { type: "object" as const, properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "approve_scraped_event",
      description: "Approve a scraped event and create it in the database",
      parameters: {
        type: "object" as const,
        properties: {
          scraped_event_id: { type: "string", description: "The scraped event ID to approve" },
        },
        required: ["scraped_event_id"],
      },
    },
  },
];

export async function chatWithAgent(messages: ChatMessage[]): Promise<string> {
  const systemMessage: ChatMessage = { role: "system", content: SYSTEM_PROMPT };

  try {
    const client = getClient();
    const completion = await client.chat.completions.create({
      messages: [systemMessage, ...messages],
      model: "nvidia/nemotron-3-ultra-550b-a55b",
      temperature: 0.3,
      max_tokens: 1024,
      tools: NVIDIA_TOOLS,
      tool_choice: "auto",
    });

    const choice = completion.choices[0];

    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const funcName = toolCall.function.name;
      const funcArgs = JSON.parse(toolCall.function.arguments || "{}");

      const tool = tools.find((t) => t.name === funcName);
      if (tool) {
        const result = await tool.execute(funcArgs);

        const followUp = await client.chat.completions.create({
          messages: [
            systemMessage,
            ...messages,
            choice.message,
            {
              role: "tool",
              tool_call_id: toolCall.id,
              content: result,
            },
          ],
          model: "nvidia/nemotron-3-ultra-550b-a55b",
          temperature: 0.7,
          max_tokens: 1024,
        });

        return followUp.choices[0]?.message?.content || result;
      }
    }

    return choice.message?.content || "申し訳ありません。回答を生成できませんでした。";
  } catch (error) {
    console.error("AI Agent error:", error);
    return "エラーが発生しました: " + (error instanceof Error ? error.message : "不明なエラー");
  }
}
