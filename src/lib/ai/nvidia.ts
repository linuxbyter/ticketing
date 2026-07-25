import OpenAI from "openai";
import { db } from "@/lib/db";
import { orders, events, tickets, payments } from "@/lib/db/schema";
import { eq, sql, count, sum } from "drizzle-orm";

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
];

const SYSTEM_PROMPT = `You are an AI agent for Kippo🌸, a Japanese ticketing platform. You have direct access to the database and can perform actions.

CAPABILITIES:
- View statistics and analytics
- List pending orders
- List events
- Approve or reject orders

AVAILABLE TOOLS:
- get_stats: Get dashboard statistics
- list_pending_orders: Show orders waiting for approval
- list_events: Show all events
- approve_order: Approve an order (provide order_id)
- reject_order: Reject an order (provide order_id)

RULES:
- Always respond in Japanese unless the user writes in another language
- When performing destructive actions (reject), confirm with the user first
- Show results in a readable format
- Be concise and helpful

DATABASE SCHEMA:
- events: id, title_ja, title_en, title_zh, venue, event_date, status
- orders: id, customer_name, customer_email, status, total_amount, created_at, approved_at
- tickets: id, event_id, tier_id, ticket_code, status
- ticket_tiers: id, event_id, name_ja, price, quantity_total, quantity_sold
- payments: id, order_id, method, amount, status`;

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
];

export async function chatWithAgent(messages: ChatMessage[]): Promise<string> {
  const systemMessage: ChatMessage = { role: "system", content: SYSTEM_PROMPT };

  try {
    const client = getClient();
    const completion = await client.chat.completions.create({
      messages: [systemMessage, ...messages],
      model: "meta/llama-3.3-70b-instruct",
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
          model: "meta/llama-3.3-70b-instruct",
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
