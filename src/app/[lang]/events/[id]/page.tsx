"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Tier {
  id: string;
  nameJa: string;
  nameEn: string;
  nameZh: string;
  price: string;
  quantityTotal: number;
  quantitySold: number;
}

interface EventDetail {
  id: string;
  titleJa: string;
  titleEn: string;
  titleZh: string;
  descriptionJa: string | null;
  descriptionEn: string | null;
  descriptionZh: string | null;
  venue: string;
  address: string | null;
  eventDate: string;
  imageUrl: string | null;
  status: string;
  tiers: Tier[];
  dates: { id: string; date: string; label: string | null }[];
}

export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/public/events/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setEvent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">イベントが見つかりません</p>
        <Link href="/events">
          <Button variant="outline">← イベント一覧に戻る</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
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

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-16">
        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background mb-10 aspect-[21/9] flex items-center justify-center">
          {event.imageUrl ? (
            <img src={event.imageUrl} alt={event.titleJa} className="w-full h-full object-cover" />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
              <div className="relative text-center">
                <div className="w-20 h-20 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-soft">
                  <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                  </svg>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left: Event info */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="bg-mint/10 text-mint border-0 text-xs font-semibold">
                  ○ 販売中
                </Badge>
                {event.dates.length > 1 && (
                  <Badge variant="secondary" className="bg-primary/5 text-primary border-0 text-xs">
                    {event.dates.length}日間
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
                {event.titleJa}
              </h1>
              {event.descriptionJa && (
                <p className="text-muted-foreground leading-relaxed">{event.descriptionJa}</p>
              )}
            </div>

            {/* Details */}
            <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-4">
              {/* Dates */}
              {event.dates.length > 0 && (
                <>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                    </div>
                    <div>
                      {event.dates.map((d, i) => (
                        <div key={d.id} className="mb-1 last:mb-0">
                          <p className="text-sm font-medium text-foreground">
                            {d.label && <span className="text-primary mr-1">{d.label}:</span>}
                            {new Date(d.date).toLocaleDateString("ja-JP", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              weekday: "long",
                            })}
                            {" "}
                            {new Date(d.date).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-px bg-border/50" />
                </>
              )}

              {/* Venue */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{event.venue}</p>
                  {event.address && (
                    <p className="text-sm text-muted-foreground">{event.address}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Ticket selection */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-2xl border border-border/50 overflow-hidden shadow-soft">
              <div className="p-6">
                <h3 className="text-sm font-semibold text-foreground mb-1">チケット選択</h3>
                <p className="text-xs text-muted-foreground mb-6">ご希望の席種をお選びください</p>

                <div className="space-y-3">
                  {event.tiers.map((tier) => {
                    const remaining = tier.quantityTotal - tier.quantitySold;
                    const isAvailable = remaining > 0;
                    const statusIcon = remaining > 20 ? "○" : remaining > 0 ? "△" : "×";
                    const statusColor = remaining > 20 ? "text-mint" : remaining > 0 ? "text-amber-500" : "text-destructive";

                    return (
                      <div key={tier.id} className="border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${statusColor}`}>{statusIcon}</span>
                            <span className="text-sm font-medium text-foreground">{tier.nameJa}</span>
                          </div>
                          <span className="text-sm font-bold text-foreground">¥{Number(tier.price).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            残り{remaining}枚
                          </span>
                          {isAvailable ? (
                            <Link href={`/checkout?event=${event.id}&tier=${tier.id}`}>
                              <Button size="sm" className="h-8 px-4 text-xs font-medium gradient-sakura text-white border-0">
                                選択する
                              </Button>
                            </Link>
                          ) : (
                            <Button size="sm" variant="secondary" disabled className="h-8 px-4 text-xs">
                              完売
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {event.tiers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">チケット情報はまだありません</p>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-secondary/50 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  <span>安全な取引を保証</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
