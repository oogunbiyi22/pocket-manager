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
      <body style={{ background: "#0d0d0b", color: "#fff", fontFamily: "monospace", padding: "2rem" }}>
        <h1 style={{ color: "#e24b4a", fontSize: "1.25rem", marginBottom: "1rem" }}>Runtime Error</h1>
        <pre style={{ background: "#1e1e1b", padding: "1rem", borderRadius: "8px", overflow: "auto", fontSize: "0.8rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {error?.message ?? "Unknown error"}
          {"\n\n"}
          {error?.stack ?? ""}
        </pre>
        <button
          onClick={reset}
          style={{ marginTop: "1rem", background: "#fff", color: "#0d0d0b", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", border: "none" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
