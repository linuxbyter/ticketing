import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Lock, CheckCircle, Clock } from "lucide-react";

type Props = {
  params: Promise<{ lang: string; id: string }>;
};

export default async function OrderPage({ params }: Props) {
  const { lang, id } = await params;
  setRequestLocale(lang);
  return <OrderContent orderId={id} />;
}

function OrderContent({ orderId }: { orderId: string }) {
  const t = useTranslations();

  const order = {
    id: orderId,
    status: "completed" as "pending_approval" | "approved" | "rejected" | "completed",
    totalAmount: "25,000",
    eventName: "よひろ 2026",
    tier: "VIP席",
    quantity: 1,
    ticketCode: "TK-2026-A1B2",
    password: "xK9mP2vL",
  };

  const statusConfig = {
    pending_approval: { icon: Clock, label: "承認待ち", color: "text-amber-500", bg: "bg-amber-50" },
    approved: { icon: CheckCircle, label: "承認済み", color: "text-blue-500", bg: "bg-blue-50" },
    rejected: { icon: Clock, label: "却下", color: "text-destructive", bg: "bg-red-50" },
    completed: { icon: CheckCircle, label: "チケット発行済み", color: "text-mint", bg: "bg-emerald-50" },
  };

  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  return (
    <main className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-xl font-bold tracking-tight text-foreground">
              Kippo<span className="text-primary">🌸</span>
            </span>
          </Link>
          <Link href="/events">
            <Button variant="ghost" size="sm" className="text-sm font-medium text-muted-foreground">
              ← イベント一覧
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-6 pt-28 pb-16">
        {/* Status badge */}
        <div className="text-center mb-8">
          <div className={`w-14 h-14 rounded-2xl ${status.bg} flex items-center justify-center mx-auto mb-4`}>
            <StatusIcon className={`w-7 h-7 ${status.color}`} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">{status.label}</h1>
          <p className="text-sm text-muted-foreground">注文番号: {order.id}</p>
        </div>

        {/* Order info */}
        <div className="bg-card rounded-2xl border border-border/50 p-6 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">イベント</span>
              <span className="text-sm font-medium text-foreground">{order.eventName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">席種</span>
              <span className="text-sm font-medium text-foreground">{order.tier}</span>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-foreground">合計</span>
              <span className="text-lg font-bold text-foreground">¥{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Ticket (if completed) */}
        {order.status === "completed" && (
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            <div className="p-6">
              {/* Ticket code */}
              <div className="bg-secondary/50 rounded-xl p-4 mb-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">チケットコード</p>
                <p className="text-xl font-bold font-mono text-foreground tracking-wider">{order.ticketCode}</p>
              </div>

              {/* Password */}
              <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <p className="text-xs font-semibold text-amber-700">チケットのパスワード</p>
                </div>
                <p className="text-lg font-bold font-mono text-amber-800 tracking-wider">{order.password}</p>
                <p className="text-[10px] text-amber-600/70 mt-1.5">
                  PDFを開く際にこのパスワードを入力してください
                </p>
              </div>

              {/* Download button */}
              <Button className="w-full h-12 gradient-sakura text-white text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
                <Download className="w-4 h-4" />
                チケットをダウンロード (PDF)
              </Button>
            </div>
          </div>
        )}

        {/* Pending message */}
        {order.status === "pending_approval" && (
          <div className="bg-card rounded-2xl border border-border/50 p-6 text-center">
            <Clock className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">管理者の承認をお待ちください</p>
            <p className="text-xs text-muted-foreground">承認後、メールでチケットが届きます</p>
          </div>
        )}
      </div>
    </main>
  );
}
