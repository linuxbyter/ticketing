"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, Loader2, Database, Zap } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  isTool?: boolean;
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "こんにちは！Kippo🌸 AIアシスタントです。データベースへの直接アクセス権限があります。\n\n何でもお聞きください：\n• 「承認待ちの注文を表示」\n• 「今月の売上は？」\n• 「新しいイベントを作成: ロックフェス、東京ドーム、2026-12-01」\n• 「ORD-001を承認」",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }].map(
            (m) => ({ role: m.role, content: m.content })
          ),
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response || data.error },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "エラーが発生しました。もう一度お試しください。",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            AIアシスタント
          </h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-mint/10 text-mint border border-mint/20">
            DB接続済み
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          自然な日本語でデータベースを操作できます
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-soft">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  message.role === "user"
                    ? "bg-foreground text-background rounded-br-md"
                    : "bg-secondary/80 text-foreground rounded-bl-md"
                }`}
              >
                {message.content}
              </div>
              {message.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-secondary/80 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">
                  思考中...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <div className="p-4 border-t border-border/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="データベースに何をしますか？"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="rounded-xl border-border/50 bg-secondary/30 focus:bg-background"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-xl gradient-sakura text-white border-0 px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="flex items-center gap-4 mt-2 px-1">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
              <Database className="w-3 h-3" />
              <span>DB読み書き可能</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
              <Zap className="w-3 h-3" />
              <span>NVIDIA AI</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
