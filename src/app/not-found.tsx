import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        margin: 0,
        background: "#0d0d0b",
        color: "#f5f4f0",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "360px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(245,244,240,0.35)",
            marginBottom: "8px",
          }}
        >
          Pocket Manager
        </div>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 300,
            letterSpacing: "-0.03em",
            margin: "0 0 12px",
          }}
        >
          Page not found.
        </h1>
        <p
          style={{
            fontSize: "14px",
            lineHeight: "1.6",
            color: "rgba(245,244,240,0.45)",
            margin: "0 0 32px",
          }}
        >
          This page doesn&apos;t exist. Your catalog and data are safe.
        </p>
        <Link
          href="/home"
          style={{
            display: "inline-block",
            background: "#f5f4f0",
            color: "#0d0d0b",
            borderRadius: "12px",
            padding: "12px 28px",
            fontSize: "14px",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
