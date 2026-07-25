"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <main style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#fafafa",
        }}>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
              エラーが発生しました
            </h2>
            <p style={{ color: "#666", marginBottom: "1.5rem" }}>
              予期しないエラーが発生しました。もう一度お試しください。
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.75rem",
                background: "#ff6b9d",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "500",
              }}
            >
              もう一度試す
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
