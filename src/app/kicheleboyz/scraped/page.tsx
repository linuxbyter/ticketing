"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface ScrapedEvent {
  id: string;
  source: string;
  sourceUrl: string;
  title: string;
  venue: string | null;
  eventDate: string | null;
  imageUrl: string | null;
  status: string;
  createdAt: string;
}

export default function ScrapedEventsPage() {
  const [events, setEvents] = useState<ScrapedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/admin/scraped-events");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to fetch events");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleScrape = async () => {
    setIsScraping(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/scraped-events/scrape");
      const data = await res.json();
      if (data.success) {
        const total = data.scraped?.total ?? 0;
        setMessage(`${total}件のイベントを取得しました`);
      } else {
        setMessage("スクレイピングに失敗しました");
      }
      await fetchEvents();
    } catch (e) {
      setMessage("エラーが発生しました");
      console.error("Scrape error:", e);
    } finally {
      setIsScraping(false);
    }
  };

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await fetch("/api/admin/scraped-events/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scraped_event_id: id }),
      });
      await fetchEvents();
    } catch {
      console.error("Failed to approve");
    } finally {
      setApprovingId(null);
    }
  };

  const handleIgnore = async (id: string) => {
    try {
      await fetch("/api/admin/scraped-events/ignore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scraped_event_id: id }),
      });
      await fetchEvents();
    } catch {
      console.error("Failed to ignore");
    }
  };

  const sourceColors: Record<string, string> = {
    eplus: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    livefans: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    pia: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            スクレイピングイベント
          </h1>
          <p className="text-sm text-muted-foreground">
            サイトから自動取得したイベント
          </p>
        </div>
        <Button
          onClick={handleScrape}
          disabled={isScraping}
          className="rounded-xl gradient-sakura text-white border-0"
        >
          {isScraping ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {isScraping ? "スクレイピング中..." : "今すぐスクレイプ"}
        </Button>
      </div>

      {message && (
        <div className="text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-lg">
          {message}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            スクレイピングイベントはありません。「今すぐスクレイプ」をクリックしてください。
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card
              key={event.id}
              className="border-border/50 shadow-soft overflow-hidden"
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          sourceColors[event.source] || "bg-gray-500/10"
                        }`}
                      >
                        {event.source.toUpperCase()}
                      </span>
                      {event.status === "created" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-500 border border-green-500/20">
                          作成済み
                        </span>
                      )}
                      {event.status === "ignored" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-500/10 text-gray-500 border border-gray-500/20">
                          無視
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm truncate">
                      {event.title}
                    </h3>
                    <div className="text-xs text-muted-foreground mt-1">
                      {event.venue && <span>会場: {event.venue} · </span>}
                      {event.eventDate && <span>{event.eventDate}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {event.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 border-green-500/20 text-green-600 hover:bg-green-500/10"
                          onClick={() => handleApprove(event.id)}
                          disabled={approvingId === event.id}
                        >
                          {approvingId === event.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 border-red-500/20 text-red-600 hover:bg-red-500/10"
                          onClick={() => handleIgnore(event.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                    <a
                      href={event.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
