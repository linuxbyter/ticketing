"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, X, Send, Copy, Check } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [copied, setCopied] = useState(false);

  const event = {
    title: "よひろ 2026",
    tier: "VIP席",
    price: "25,000",
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("ファイルサイズは5MB以下にしてください");
        return;
      }
      setScreenshot(file);
      setError("");
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setScreenshot(null);
    setPreview(null);
    const input = document.getElementById("receipt-upload") as HTMLInputElement;
    if (input) input.value = "";
  };

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText("08019932477");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = "08019932477";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim()) {
      setError("名前とメールアドレスを入力してください");
      return;
    }
    if (!screenshot) {
      setError("支払いスクリーンショットをアップロードしてください");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("email", form.email);
      formData.append("name", form.name);
      formData.append("amount", "25000");
      formData.append("screenshot", screenshot);

      const res = await fetch("/api/orders", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || "エラーが発生しました。もう一度お試しください。");
      }
    } catch {
      setError("エラーが発生しました。もう一度お試しください。");
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">ご注文ありがとうございます</h2>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            お支払い確認のお知らせをお送りしました。確認完了後、電子チケットをメールでお届けします。
          </p>
          <p className="text-xs text-muted-foreground/60 mb-8">
            処理には通常10分程度かかります。
          </p>
          <Link href="/ja">
            <Button variant="ghost" className="text-muted-foreground">トップに戻る</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/ja" className="flex items-center gap-2.5">
            <span className="text-xl font-bold tracking-tight text-foreground">
              Kippo<span className="text-primary">🌸</span>
            </span>
          </Link>
          <Link href="/ja/events">
            <Button variant="ghost" size="sm" className="text-sm font-medium text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-1" />
              戻る
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">支払い</h1>
          <p className="text-sm text-muted-foreground">以下の手順に従ってお支払いください</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Ticket summary */}
          <div className="bg-card rounded-2xl border border-border/50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{event.title}</p>
                <p className="text-sm font-semibold text-foreground">{event.tier}</p>
              </div>
              <p className="text-xl font-bold text-foreground">¥{event.price}</p>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-card rounded-2xl border border-border/50 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">支払い方法</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-50 text-pink-600 border border-pink-100">PayPay</span>
            </div>

            {/* Open PayPay button */}
            <a
              href="paypay://send?phone=08019932477&amount=25000"
              onClick={(e) => {
                setTimeout(() => {
                  if (!document.hidden) {
                    window.open("https://paypay.ne.jp/", "_blank");
                  }
                }, 2500);
              }}
              className="flex items-center justify-center gap-2.5 w-full h-14 rounded-xl bg-[#ff0033] hover:bg-[#e6002d] text-white font-bold text-base transition-all shadow-lg shadow-[#ff0033]/20 hover:shadow-xl active:scale-[0.98]"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.5 3C5.01 3 3 5.01 3 7.5v9C3 18.99 5.01 21 7.5 21h9c2.49 0 4.5-2.01 4.5-4.5v-9C21 5.01 18.99 3 16.5 3h-9zm1.08 3.12L12 10.5l3.42-4.38a.75.75 0 011.17.94l-2.5 3.17h3.08a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75H14l2.5 3.17a.75.75 0 01-1.17.94L12 15l-3.42 4.38a.75.75 0 01-1.17-.94l2.5-3.17H6.75a.75.75 0 01-.75-.75V12.3a.75.75 0 01.75-.75h3.58l-2.5-3.17a.75.75 0 011.17-.94z"/>
              </svg>
              PayPayで支払う
            </a>

            <p className="text-center text-[10px] text-muted-foreground">
              タップでPayPayアプリが開きます
            </p>

            <div className="relative flex items-center gap-3">
              <div className="h-px flex-1 bg-border/50" />
              <span className="text-[10px] text-muted-foreground">または手動送金</span>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            {/* Phone number + copy */}
            <div className="bg-gradient-to-br from-pink-50/80 to-rose-50/50 rounded-xl p-4 space-y-3">
              <div className="bg-white rounded-lg p-3 border border-pink-100/50">
                <p className="text-[10px] text-muted-foreground mb-1">PayPay電話番号</p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-foreground font-mono tracking-wide">080-1993-2477</p>
                  <button
                    type="button"
                    onClick={copyPhone}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-50 text-pink-600 text-xs font-medium hover:bg-pink-100 transition-colors shrink-0"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "コピー済み" : "コピー"}
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-pink-100/50">
                <p className="text-[10px] text-muted-foreground mb-0.5">お支払い金額</p>
                <p className="text-2xl font-bold text-rose-600">¥{event.price}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-primary shrink-0 mt-0.5">1.</span>
                <p className="text-xs text-muted-foreground">上のボタンでPayPayを開くか、電話番号 <strong className="text-foreground">080-1993-2477</strong> に送金</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-primary shrink-0 mt-0.5">2.</span>
                <p className="text-xs text-muted-foreground">送金完了画面のスクリーンショットを撮影</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-primary shrink-0 mt-0.5">3.</span>
                <p className="text-xs text-muted-foreground">下のフォームにアップロードして送信</p>
              </div>
            </div>
          </div>

          {/* Customer info + upload */}
          <div className="bg-card rounded-2xl border border-border/50 p-5 space-y-5">
            <h3 className="text-sm font-semibold text-foreground">ご注文情報</h3>

            <div>
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                メールアドレス <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="h-11 rounded-xl border-border/50 bg-secondary/30 focus:bg-background transition-colors"
              />
              <p className="text-[10px] text-muted-foreground mt-1">チケット（PDF）をこのメールアドレスに送信します</p>
            </div>

            <div>
              <Label htmlFor="name" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                お名前 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="田中 太郎"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="h-11 rounded-xl border-border/50 bg-secondary/30 focus:bg-background transition-colors"
              />
            </div>

            {/* Upload */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                支払い証明スクリーンショット <span className="text-destructive">*</span>
              </Label>

              {!preview ? (
                <label
                  htmlFor="receipt-upload"
                  className="flex flex-col items-center justify-center w-full border-2 border-dashed border-border/60 rounded-xl p-8 text-center hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">タップしてアップロード</p>
                  <p className="text-[10px] text-muted-foreground">JPG, PNG (最大5MB)</p>
                </label>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-border/50">
                  <img src={preview} alt="支払いスクリーンショット" className="w-full h-48 object-cover" />
                  <button
                    type="button"
                    onClick={removeFile}
                    aria-label="ファイルを削除"
                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-foreground/80 flex items-center justify-center text-white hover:bg-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/60 to-transparent p-3">
                    <p className="text-xs text-white font-medium">{screenshot?.name}</p>
                  </div>
                </div>
              )}

              <input
                id="receipt-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ position: "absolute", left: "-9999px", opacity: 0 }}
                tabIndex={-1}
              />
            </div>
          </div>

<Button
  type="submit"
  disabled={uploading}
  className="w-full h-12 rounded-xl text-sm font-medium gradient-sakura text-white border-0 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50"
>
            {uploading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                送信中...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                注文を送信する
              </span>
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
