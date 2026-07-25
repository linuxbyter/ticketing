"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  ShoppingCart,
  Clock,
  Bot,
  Mail,
  Home,
  Globe,
} from "lucide-react";

const navItems = [
  { href: "/kicheleboyz", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/kicheleboyz/approvals", label: "承認待ち", icon: Clock },
  { href: "/kicheleboyz/events", label: "イベント", icon: Calendar },
  { href: "/kicheleboyz/orders", label: "注文", icon: ShoppingCart },
  { href: "/kicheleboyz/scraped", label: "スクレイピング", icon: Globe },
  { href: "/kicheleboyz/ai", label: "AI", icon: Bot },
  { href: "/kicheleboyz/emails", label: "送信履歴", icon: Mail },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-card border-r border-border/50 min-h-screen flex flex-col">
      <div className="p-5 border-b border-border/50">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-base font-bold tracking-tight text-foreground">
            Kippo<span className="text-primary">🌸</span>
          </span>
        </Link>
        <p className="text-[10px] text-muted-foreground mt-0.5">管理画面</p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/kicheleboyz" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/5 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/50">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-150"
        >
          <Home className="w-4 h-4" />
          サイトを見る
        </Link>
      </div>
    </aside>
  );
}
