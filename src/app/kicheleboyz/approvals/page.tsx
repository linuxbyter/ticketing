"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Eye, Image, Loader2 } from "lucide-react";

interface PendingOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  status: string;
  paymentScreenshotUrl?: string;
  createdAt: string;
  items: { tierName: string; eventName: string; quantity: number; unitPrice: string }[];
}

export default function ApprovalsPage() {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchOrders = () => {
    fetch("/api/admin/orders?status=pending_approval")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  };

  useEffect(() => { fetchOrders(); }, []);

const handleApprove = async (orderId: string) => {
  setProcessing(orderId);
  try {
    await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, notes }),
    });
    setSelectedOrder(null);
    setNotes("");
    fetchOrders();
  } catch (error) {
    console.error("Approve error:", error);
    // Optionally show error to user
  } finally {
    setProcessing(null);
  }
};

const handleReject = async (orderId: string) => {
  setProcessing(orderId);
  try {
    await fetch("/api/admin/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, notes }),
    });
    setSelectedOrder(null);
    setNotes("");
    fetchOrders();
  } catch (error) {
    console.error("Reject error:", error);
    // Optionally show error to user
  } finally {
    setProcessing(null);
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">承認待ち</h1>
          <p className="text-muted-foreground">{orders.length}件の承認待ち注文があります</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {orders.map((order) => {
            const itemInfo = order.items?.map((i) => `${i.eventName} - ${i.tierName} ×${i.quantity}`).join(", ") || "チケット";
            return (
              <Card
                key={order.id}
                className={`cursor-pointer transition-colors ${selectedOrder?.id === order.id ? "border-primary" : "hover:border-muted-foreground/50"}`}
                onClick={() => setSelectedOrder(order)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedOrder(order); } }}
                role="button"
                tabIndex={0}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{order.customerName}</p>
                        <Badge variant="secondary">承認待ち</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{itemInfo}</p>
                      <p className="text-xs text-muted-foreground mt-1">{order.customerEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">¥{Number(order.totalAmount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString("ja-JP")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {orders.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">承認待ちの注文はありません</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          {selectedOrder ? (
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">注文詳細</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedOrder.paymentScreenshotUrl ? (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={selectedOrder.paymentScreenshotUrl}
                      alt="支払いスクリーンショット"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Image className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">スクリーンショットなし</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">注文ID</span>
                    <span className="font-mono text-xs">{selectedOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">顧客名</span>
                    <span>{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">メール</span>
                    <span className="text-xs">{selectedOrder.customerEmail}</span>
                  </div>
                  {selectedOrder.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-muted-foreground">{item.eventName}</span>
                      <span>{item.tierName} × {item.quantity}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold">
                    <span>合計</span>
                    <span>¥{Number(selectedOrder.totalAmount).toLocaleString()}</span>
                  </div>
                </div>

                <Textarea
                  placeholder="管理者メモ（任意）"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleApprove(selectedOrder.id)}
                    disabled={processing === selectedOrder.id}
                  >
                    {processing === selectedOrder.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    承認
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleReject(selectedOrder.id)}
                    disabled={processing === selectedOrder.id}
                  >
                    {processing === selectedOrder.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    却下
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">注文を選択して詳細を表示</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
