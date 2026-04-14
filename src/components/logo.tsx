"use client";

// ─── The Pocket Manager mark ────────────────────────────────────────────────
// A "P" letterform with a deliberate gap at the closing arc.
// The amber dot marks the gap — the missing revenue, the thing we find.
// When you close all your gaps, the P completes.

export function LogoMark({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Pocket Manager"
    >
      {/* Background */}
      <rect width="40" height="40" rx="11" fill="#0d0d0b" />

      {/* Spine of P */}
      <rect x="10.5" y="8.5" width="4" height="23" rx="2" fill="white" />

      {/* Arc belly of P — top half */}
      <path
        d="M 14.5 8.5 C 22 8.5 29.5 11 29.5 16 C 29.5 21 22 23.5 14.5 23.5"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Gap dot — the missing piece, the revenue to collect */}
      <circle cx="14.5" cy="23.5" r="3" fill="#ef9f27" />
    </svg>
  );
}

// ─── Full wordmark ──────────────────────────────────────────────────────────
export function LogoWordmark({
  size = 32,
  light = false,
}: {
  size?: number;
  light?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <div>
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: light ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}
        >
          Pocket
        </div>
        <div
          className="-mt-0.5 text-[17px] font-normal tracking-[-0.02em] leading-none"
          style={{ color: light ? "white" : "#0d0d0b" }}
        >
          Manager
        </div>
      </div>
    </div>
  );
}

// ─── Inline mark for tight spaces ──────────────────────────────────────────
export function LogoInline({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={24} />
      <span
        className="text-[15px] font-normal tracking-[-0.02em]"
        style={{ color: light ? "white" : "#0d0d0b" }}
      >
        Pocket Manager
      </span>
    </div>
  );
}
