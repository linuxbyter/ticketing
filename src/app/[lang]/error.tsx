"use client";

import { Button } from "@/components/ui/button";

export default function LangError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          エラーが発生しました
        </h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          予期しないエラーが発生しました。もう一度お試しください。
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={reset} className="gradient-sakura text-white border-0">
            もう一度試す
          </Button>
          <Button variant="ghost" onClick={() => (window.location.href = "/ja")}>
            トップに戻る
          </Button>
        </div>
      </div>
    </main>
  );
}
