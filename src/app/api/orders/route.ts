import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, payments, orderItems, tickets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string || null;
    const amount = formData.get("amount") as string;
    const screenshot = formData.get("screenshot") as File | null;
    const eventId = formData.get("eventId") as string || null;
    const tierId = formData.get("tierId") as string || null;

    if (!email || !name || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let screenshotUrl = null;
    if (screenshot) {
      const bytes = await screenshot.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      screenshotUrl = `data:${screenshot.type};base64,${base64}`;
    }

    const [order] = await db
      .insert(orders)
      .values({
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        totalAmount: amount,
        paymentScreenshotUrl: screenshotUrl,
        status: "pending_approval",
      })
      .returning();

    await db.insert(payments).values({
      orderId: order.id,
      method: "paypay",
      amount: amount,
      screenshotUrl: screenshotUrl,
      status: "pending",
    });

    if (eventId && tierId) {
      const ticket = await db
        .select()
        .from(tickets)
        .where(eq(tickets.tierId, tierId))
        .limit(1)
        .then((r) => r[0]);

      if (ticket) {
        await db.insert(orderItems).values({
          orderId: order.id,
          ticketId: ticket.id,
          quantity: 1,
          unitPrice: amount,
        });
      }
    }

    Promise.allSettled([
      transporter.sendMail({
        from: '"Kippo🌸" <' + process.env.GMAIL_USER + ">",
        to: email,
        subject: "【Kippo🌸】注文を受け付けました - 支払い確認中",
        html: '<div style="font-family:sans-serif;padding:40px;max-width:500px;margin:0 auto"><div style="background:white;border-radius:16px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.04)"><div style="font-size:24px;font-weight:bold;text-align:center;margin-bottom:24px">Kippo🌸</div><p style="font-size:14px">' + name + ' 様、注文ありがとうございます。</p><p style="font-size:14px">注文番号: <strong>' + order.id + '</strong></p><p style="font-size:14px">金額: <strong style="color:#ff6b9d">¥' + Number(amount).toLocaleString() + '</strong></p><div style="background:#f0fef4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:20px 0;font-size:13px;color:#166534"><strong>確認まで約10分ほどお待ちください。</strong></div></div></div>',
      }).catch((e) => console.error("Email error:", e)),

      (async () => {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
        if (!BOT_TOKEN || !CHAT_ID || CHAT_ID === "PLACEHOLDER") return;

        const text = "🎫 *新しい注文*\n\n注文番号: `" + order.id + "`\n顧客名: " + name + "\nメール: " + email + "\n金額: ¥" + Number(amount).toLocaleString() + "\n\nステータス: 承認待ち";

        await fetch("https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "Markdown" }),
        }).catch((e) => console.error("Telegram text error:", e));

        if (screenshot) {
          const bytes = await screenshot.arrayBuffer();
          const blob = new Blob([new Uint8Array(bytes)], { type: screenshot.type || "image/jpeg" });
          const fd = new FormData();
          fd.append("chat_id", CHAT_ID);
          fd.append("caption", "支払い証明 " + order.id + " - " + name);
          fd.append("photo", blob, "receipt.jpg");

          await fetch("https://api.telegram.org/bot" + BOT_TOKEN + "/sendPhoto", {
            method: "POST",
            body: fd,
          }).catch((e) => console.error("Telegram photo error:", e));
        }
      })(),
    ]).catch(() => {});

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
