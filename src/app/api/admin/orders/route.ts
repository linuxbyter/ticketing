import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, tickets, ticketTiers, events } from "@/lib/db/schema";
import { eq, desc, sql, like, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const allOrders = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        totalAmount: orders.totalAmount,
        status: orders.status,
        adminNotes: orders.adminNotes,
        paymentScreenshotUrl: orders.paymentScreenshotUrl,
        createdAt: orders.createdAt,
        approvedAt: orders.approvedAt,
      })
      .from(orders)
      .where(
        status
          ? eq(orders.status, status as any)
          : sql`1=1`
      )
      .orderBy(desc(orders.createdAt));

    const result = await Promise.all(
      allOrders.map(async (order) => {
        let items: any[] = [];
        try {
          items = await db
            .select({
              tierName: ticketTiers.nameJa,
              eventName: events.titleJa,
              quantity: orderItems.quantity,
              unitPrice: orderItems.unitPrice,
            })
            .from(orderItems)
            .leftJoin(tickets, eq(orderItems.ticketId, tickets.id))
            .leftJoin(ticketTiers, eq(tickets.tierId, ticketTiers.id))
            .leftJoin(events, eq(ticketTiers.eventId, events.id))
            .where(eq(orderItems.orderId, order.id));
        } catch {
          items = [];
        }

        return {
          ...order,
          items,
        };
      })
    );

    let filtered = result;
    if (search) {
      const q = search.toLowerCase();
      filtered = result.filter(
        (o) =>
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
      );
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Orders API error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
