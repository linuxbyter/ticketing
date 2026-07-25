"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  Trash2,
  Loader2,
  Upload,
  X,
  Image,
} from "lucide-react";

interface EventDate {
  id: string;
  date: string;
  label: string | null;
}

interface TicketTier {
  id: string;
  nameJa: string;
  nameEn: string;
  nameZh: string;
  price: string;
  quantityTotal: number;
  quantitySold: number;
  isActive: string;
}

interface Event {
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
  createdAt: string;
  tiers: TicketTier[];
  dates: EventDate[];
  totalTickets: number;
  soldTickets: number;
}

export default function EventsManagementPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    titleJa: "",
    titleEn: "",
    titleZh: "",
    descriptionJa: "",
    descriptionEn: "",
    descriptionZh: "",
    venue: "",
    address: "",
    eventDate: "",
    status: "draft",
    imageUrl: "",
  });

  const [tiers, setTiers] = useState([
    { nameJa: "", nameEn: "", nameZh: "", price: "", quantityTotal: "" },
  ]);

  const [eventDates, setEventDates] = useState([
    { date: "", label: "" },
  ]);

  const fetchEvents = () => {
    fetch("/api/admin/events")
      .then((r) => r.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      });
  };

  useEffect(() => { fetchEvents(); }, []);

  const filteredEvents = events.filter(
    (e) =>
      e.titleJa.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    active: "bg-green-100 text-green-800",
    sold_out: "bg-red-100 text-red-800",
    ended: "bg-blue-100 text-blue-800",
  };

  const statusLabels: Record<string, string> = {
    draft: "下書き",
    active: "販売中",
    sold_out: "完売",
    ended: "終了",
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
        setForm({ ...form, imageUrl: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addTier = () => {
    setTiers([...tiers, { nameJa: "", nameEn: "", nameZh: "", price: "", quantityTotal: "" }]);
  };

  const removeTier = (i: number) => {
    setTiers(tiers.filter((_, idx) => idx !== i));
  };

  const updateTier = (i: number, field: string, value: string) => {
    const updated = [...tiers];
    (updated[i] as any)[field] = value;
    setTiers(updated);
  };

  const addDate = () => {
    setEventDates([...eventDates, { date: "", label: "" }]);
  };

  const removeDate = (i: number) => {
    setEventDates(eventDates.filter((_, idx) => idx !== i));
  };

  const updateDate = (i: number, field: string, value: string) => {
    const updated = [...eventDates];
    (updated[i] as any)[field] = value;
    setEventDates(updated);
  };

  const handleCreate = async () => {
    if (!form.titleJa || !form.venue || !form.eventDate) return;
    setCreating(true);

    await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tiers: tiers.filter((t) => t.nameJa && t.price && t.quantityTotal).map((t) => ({
          ...t,
          quantityTotal: parseInt(t.quantityTotal),
        })),
        dates: eventDates.filter((d) => d.date).map((d) => ({
          date: d.date,
          label: d.label || null,
        })),
      }),
    });

    setForm({
      titleJa: "", titleEn: "", titleZh: "",
      descriptionJa: "", descriptionEn: "", descriptionZh: "",
      venue: "", address: "", eventDate: "", status: "draft", imageUrl: "",
    });
    setTiers([{ nameJa: "", nameEn: "", nameZh: "", price: "", quantityTotal: "" }]);
    setEventDates([{ date: "", label: "" }]);
    setImagePreview(null);
    setShowAdd(false);
    setCreating(false);
    fetchEvents();
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("このイベントを削除しますか？")) return;
    setDeleting(eventId);
    await fetch(`/api/admin/events?id=${eventId}`, { method: "DELETE" });
    setDeleting(null);
    fetchEvents();
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
        <h1 className="text-2xl font-bold">イベント管理</h1>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger render={<Button />}>
            <Plus className="w-4 h-4 mr-2" />
            新規イベント
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新規イベント作成</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* Image */}
              <div>
                <label className="text-sm font-medium mb-1 block">イベント画像</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                {imagePreview ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setImagePreview(null); setForm({ ...form, imageUrl: "" }); }}
                      aria-label="画像を削除"
                      className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-lg flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">クリックして画像を選択</span>
                  </button>
                )}
              </div>

              {/* Titles */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">タイトル（日本語）*</label>
                  <Input value={form.titleJa} onChange={(e) => setForm({ ...form, titleJa: e.target.value })} placeholder="よひろ 2026" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">タイトル（英語）</label>
                  <Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} placeholder="Yohiro 2026" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">タイトル（中文）</label>
                  <Input value={form.titleZh} onChange={(e) => setForm({ ...form, titleZh: e.target.value })} placeholder="よひろ 2026" />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">説明（日本語）</label>
                  <Textarea value={form.descriptionJa} onChange={(e) => setForm({ ...form, descriptionJa: e.target.value })} rows={3} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">説明（英語）</label>
                  <Textarea value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} rows={3} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">説明（中文）</label>
                  <Textarea value={form.descriptionZh} onChange={(e) => setForm({ ...form, descriptionZh: e.target.value })} rows={3} />
                </div>
              </div>

              {/* Venue & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">会場*</label>
                  <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="東京ドーム" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">メイン日程*</label>
                  <Input type="datetime-local" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">住所</label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="東京都文京区后楽1-3-61" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">ステータス</label>
                <div className="flex gap-2">
                  {(["draft", "active"] as const).map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant={form.status === s ? "default" : "outline"}
                      size="sm"
                      onClick={() => setForm({ ...form, status: s })}
                    >
                      {statusLabels[s]}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Event Dates */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">開催日程（複数日対応）</label>
                  <Button type="button" variant="outline" size="sm" onClick={addDate}>
                    <Plus className="w-3 h-3 mr-1" /> 日程追加
                  </Button>
                </div>
                <div className="space-y-2">
                  {eventDates.map((d, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input
                        type="datetime-local"
                        value={d.date}
                        onChange={(e) => updateDate(i, "date", e.target.value)}
                        className="flex-1"
                        placeholder="日程"
                      />
                      <Input
                        value={d.label}
                        onChange={(e) => updateDate(i, "label", e.target.value)}
                        className="w-40"
                        placeholder="ラベル（例：1日目）"
                      />
                      {eventDates.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeDate(i)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ticket Tiers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">チケット種別</label>
                  <Button type="button" variant="outline" size="sm" onClick={addTier}>
                    <Plus className="w-3 h-3 mr-1" /> 種別追加
                  </Button>
                </div>
                <div className="space-y-3">
                  {tiers.map((tier, i) => (
                    <div key={i} className="border border-border/50 rounded-lg p-3 space-y-2">
                      <div className="flex gap-2 items-center">
                        <Input value={tier.nameJa} onChange={(e) => updateTier(i, "nameJa", e.target.value)} placeholder="名前（日本語）*" className="flex-1" />
                        <Input value={tier.nameEn} onChange={(e) => updateTier(i, "nameEn", e.target.value)} placeholder="Name (EN)" className="flex-1" />
                        <Input value={tier.nameZh} onChange={(e) => updateTier(i, "nameZh", e.target.value)} placeholder="名称（中文）" className="flex-1" />
                      </div>
                      <div className="flex gap-2 items-center">
                        <Input type="number" value={tier.price} onChange={(e) => updateTier(i, "price", e.target.value)} placeholder="価格（円）*" className="w-36" />
                        <Input type="number" value={tier.quantityTotal} onChange={(e) => updateTier(i, "quantityTotal", e.target.value)} placeholder="枚数*" className="w-36" />
                        {tiers.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeTier(i)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={handleCreate} disabled={creating || !form.titleJa || !form.venue || !form.eventDate}>
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                イベントを作成
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="イベントを検索..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredEvents.map((event) => {
          const pct = event.totalTickets > 0 ? Math.round((event.soldTickets / event.totalTickets) * 100) : 0;
          const dateLabels = event.dates?.length > 0
            ? event.dates.map((d) => d.label || new Date(d.date).toLocaleDateString("ja-JP")).join(", ")
            : new Date(event.eventDate).toLocaleDateString("ja-JP");

          return (
            <Card key={event.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {event.imageUrl ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                      <img src={event.imageUrl} alt={event.titleJa} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
                      <Image className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{event.titleJa}</h3>
                      <Badge className={statusColors[event.status] || ""}>
                        {statusLabels[event.status] || event.status}
                      </Badge>
                      {event.dates?.length > 1 && (
                        <Badge variant="outline" className="text-[10px]">
                          {event.dates.length}日間
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {dateLabels}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.venue}
                      </span>
                    </div>
                    {event.tiers?.length > 0 && (
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {event.tiers.map((t) => (
                          <span key={t.id} className="text-[10px] bg-muted px-2 py-0.5 rounded-full">
                            {t.nameJa} ¥{Number(t.price).toLocaleString()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">
                      {event.soldTickets} / {event.totalTickets} 枚
                    </p>
                    <p className="text-xs text-muted-foreground">{pct}% 販売済み</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(event.id)}
                    disabled={deleting === event.id}
                    className="shrink-0 text-destructive hover:text-destructive"
                  >
                    {deleting === event.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredEvents.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">イベントはありません</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
