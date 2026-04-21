"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase, getSupabaseConfigError, isSupabaseConfigured } from "@/lib/supabase";

type Check = { label: string; status: "ok" | "warn" | "error" | "loading"; detail?: string };

export default function StatusPage() {
  const [checks, setChecks] = useState<Check[]>([
    { label: "Supabase config", status: "loading" },
    { label: "Supabase auth", status: "loading" },
    { label: "Supabase DB tables", status: "loading" },
    { label: "AI endpoint", status: "loading" },
    { label: "Stripe billing", status: "loading" },
    { label: "Telegram bot", status: "loading" },
  ]);
  const [session, setSession] = useState<string>("Checking…");

  useEffect(() => {
    async function run() {
      const results: Check[] = [];

      // Supabase config
      const configured = isSupabaseConfigured();
      if (!configured) {
        const err = getSupabaseConfigError();
        results.push({ label: "Supabase config", status: "error", detail: err ?? "Not configured" });
        results.push({ label: "Supabase auth", status: "error", detail: "Blocked by config error" });
        results.push({ label: "Supabase DB tables", status: "error", detail: "Blocked by config error" });
      } else {
        results.push({ label: "Supabase config", status: "ok", detail: "URL and anon key present" });

        const supabase = getSupabase();
        if (!supabase) {
          results.push({ label: "Supabase auth", status: "error", detail: "Client creation failed" });
          results.push({ label: "Supabase DB tables", status: "error", detail: "Client creation failed" });
        } else {
          // Auth check
          try {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
              results.push({ label: "Supabase auth", status: "warn", detail: `Session error: ${error.message}` });
              setSession("Error");
            } else {
              const user = data?.session?.user;
              if (user) {
                setSession(`Signed in as ${user.email}`);
                results.push({ label: "Supabase auth", status: "ok", detail: `Signed in: ${user.email}` });
              } else {
                setSession("Not signed in");
                results.push({ label: "Supabase auth", status: "warn", detail: "No active session" });
              }
            }
          } catch (e) {
            results.push({ label: "Supabase auth", status: "error", detail: String(e) });
          }

          // DB tables check
          try {
            const [catalogRes, profileRes] = await Promise.allSettled([
              supabase.from("user_catalogs").select("user_id").limit(0),
              supabase.from("profiles").select("id").limit(0),
            ]);
            const catalogOk = catalogRes.status === "fulfilled" && !catalogRes.value.error;
            const profileOk = profileRes.status === "fulfilled" && !profileRes.value.error;
            const catalogErr = catalogRes.status === "fulfilled" ? catalogRes.value.error?.message : "Query failed";
            const profileErr = profileRes.status === "fulfilled" ? profileRes.value.error?.message : "Query failed";

            if (catalogOk && profileOk) {
              results.push({ label: "Supabase DB tables", status: "ok", detail: "user_catalogs + profiles exist" });
            } else {
              results.push({ label: "Supabase DB tables", status: "error", detail: [!catalogOk && `user_catalogs: ${catalogErr}`, !profileOk && `profiles: ${profileErr}`].filter(Boolean).join(" | ") });
            }
          } catch (e) {
            results.push({ label: "Supabase DB tables", status: "error", detail: String(e) });
          }
        }
      }

      // AI endpoint
      try {
        const res = await fetch("/api/v1/manager/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: "ping" }], profile: { artistName: "Test" } }),
        });
        results.push({ label: "AI endpoint", status: res.ok ? "ok" : "warn", detail: `HTTP ${res.status}` });
      } catch (e) {
        results.push({ label: "AI endpoint", status: "error", detail: String(e) });
      }

      // Stripe — check checkout API exists
      try {
        const res = await fetch("/api/v1/billing/checkout", { method: "POST", body: JSON.stringify({ plan: "pro" }), headers: { "Content-Type": "application/json" } });
        results.push({ label: "Stripe billing", status: res.status === 401 || res.status === 400 || res.ok ? "ok" : "warn", detail: `HTTP ${res.status}` });
      } catch (e) {
        results.push({ label: "Stripe billing", status: "error", detail: String(e) });
      }

      // Telegram bot
      try {
        const res = await fetch("/api/telegram/status");
        results.push({ label: "Telegram bot", status: res.ok ? "ok" : "warn", detail: `HTTP ${res.status}` });
      } catch (e) {
        results.push({ label: "Telegram bot", status: "warn", detail: "Not configured" });
      }

      setChecks(results);
    }
    void run();
  }, []);

  const colors: Record<Check["status"], string> = {
    ok: "var(--green)",
    warn: "var(--amber)",
    error: "var(--red)",
    loading: "rgba(255,255,255,0.2)",
  };
  const icons: Record<Check["status"], string> = { ok: "✓", warn: "⚠", error: "✕", loading: "·" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--void)", padding: "48px 20px", color: "var(--text-primary)" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(0,212,255,0.5)", fontFamily: "monospace", marginBottom: 8 }}>System · Status</div>
          <h1 style={{ fontSize: 32, fontWeight: 200, letterSpacing: "-0.04em", margin: "0 0 8px" }}>Master Control</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>Auth: {session}</p>
        </div>

        {/* Checks */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
          {checks.map((check) => (
            <div key={check.label} style={{ borderRadius: 12, padding: "14px 16px", border: "0.5px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 600, background: `${colors[check.status]}15`, color: colors[check.status], border: `0.5px solid ${colors[check.status]}40`, flexShrink: 0, boxShadow: check.status === "ok" ? `0 0 8px ${colors[check.status]}40` : "none" }}>
                {icons[check.status]}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,0.8)" }}>{check.label}</div>
                {check.detail && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", marginTop: 2, wordBreak: "break-all" }}>{check.detail}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Quick nav — always accessible */}
        <div style={{ borderRadius: 16, padding: 20, border: "0.5px solid rgba(0,212,255,0.12)", background: "rgba(0,212,255,0.03)", marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(0,212,255,0.4)", fontFamily: "monospace", marginBottom: 16 }}>Quick nav</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["/home", "/sign-in", "/settings", "/work", "/signal", "/harvest", "/a", "/onboarding", "/pitch-kits", "/career-twin", "/epk"].map((path) => (
              <Link key={path} href={path}>
                <span style={{ display: "inline-block", padding: "6px 14px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "monospace", cursor: "pointer" }}>
                  {path}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
          Bookmark <code style={{ fontFamily: "monospace", color: "rgba(0,212,255,0.4)" }}>pocketmanager.online/status</code> for master access
        </div>
      </div>
    </div>
  );
}
