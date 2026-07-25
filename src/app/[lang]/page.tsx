import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function HomePage({ params }: Props) {
  const { lang } = await params;
  setRequestLocale(lang);
  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations();

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
          <div className="flex items-center gap-3">
            <Link href="/events">
              <Button variant="ghost" size="sm" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                {t("nav.events")}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center relative">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
            チケットを、
            <br />
            <span className="text-primary">もっと身近に。</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            人気コンサートやイベントのチケットを、
            <br className="hidden md:block" />
            簡単に・安全に・ずっとお得に。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/events">
              <Button size="lg" className="h-14 px-8 text-base font-medium gradient-sakura text-white border-0 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200">
                イベントを探す
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="ghost" size="lg" className="h-14 px-8 text-base font-medium text-muted-foreground hover:text-foreground">
                ご利用方法
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold tracking-widest text-primary uppercase mb-3 block">How it works</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {t("home.howItWorks")}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                ),
                titleJa: "イベントを選択",
                titleEn: "Choose Event",
                desc: "興味のあるイベントを\n見つけて選択",
              },
              {
                step: "02",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                ),
                titleJa: "PayPayで支払い",
                titleEn: "Pay with PayPay",
                desc: "PayPayで簡単支払い\nスクリーンショットを送信",
              },
              {
                step: "03",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                  </svg>
                ),
                titleJa: "チケットを受け取る",
                titleEn: "Get Ticket",
                desc: "承認後、パスワード保護\nPDFチケットをメール送付",
              },
            ].map((item) => (
              <Card key={item.step} className="group border-0 bg-card shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 rounded-2xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xs font-bold text-primary/40 tracking-wider">{item.step}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{item.titleJa}</h3>
                  <p className="text-xs font-medium text-primary/60 uppercase tracking-wide mb-3">{item.titleEn}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden gradient-sakura p-12 md:p-16 text-center">
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                さぁ、始めよう。
              </h2>
              <p className="text-white/80 mb-8 max-w-md mx-auto">
                あなたの好きなアーティストのライブに行ける、その一歩を。
              </p>
              <Link href="/events">
                <Button size="lg" className="h-14 px-8 text-base font-medium bg-white text-primary hover:bg-white/90 shadow-lg">
                  今すぐ始める
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">Kippo<span className="text-primary">🌸</span></span>
            <span className="text-xs text-muted-foreground">© 2026</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span className="hover:text-foreground transition-colors cursor-pointer">利用規約</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">プライバシーポリシー</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">お問い合わせ</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
