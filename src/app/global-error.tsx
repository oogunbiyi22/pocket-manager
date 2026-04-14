"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0d0d0b", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ textAlign: "center", maxWidth: "360px" }}>
          <div style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "8px" }}>Pocket Manager</div>
          <h1 style={{ fontSize: "28px", fontWeight: 300, letterSpacing: "-0.03em", margin: "0 0 12px" }}>Something went wrong.</h1>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.45)", margin: "0 0 32px" }}>
            An unexpected error occurred. Your catalog data is safe.
          </p>
          <button
            onClick={reset}
            style={{ background: "#fff", color: "#0d0d0b", border: "none", borderRadius: "12px", padding: "12px 28px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
          >
            Try again
          </button>
          <div style={{ marginTop: "24px" }}>
            <a href="/home" style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", textDecoration: "underline" }}>
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
