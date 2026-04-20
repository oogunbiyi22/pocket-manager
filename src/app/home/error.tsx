"use client";

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#00000e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 480, width: "100%" }}>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,45,85,0.7)", fontFamily: "monospace", marginBottom: 12 }}>Home — Runtime Error</div>
        <h1 style={{ fontSize: 24, fontWeight: 300, margin: "0 0 16px" }}>Something crashed on this page.</h1>
        <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,45,85,0.06)", border: "0.5px solid rgba(255,45,85,0.2)", marginBottom: 24, fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.6)", wordBreak: "break-all", lineHeight: 1.6 }}>
          <strong style={{ color: "rgba(255,45,85,0.8)" }}>{error.name}:</strong> {error.message}
          {error.digest && <div style={{ marginTop: 8, color: "rgba(255,255,255,0.3)" }}>digest: {error.digest}</div>}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={reset} style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: "rgba(0,212,255,0.15)", border: "0.5px solid rgba(0,212,255,0.3)", color: "#00d4ff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Try again</button>
          <a href="/sign-in" style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13, textAlign: "center", display: "block" }}>Back to sign in</a>
        </div>
      </div>
    </div>
  );
}
