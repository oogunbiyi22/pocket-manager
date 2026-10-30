/**
 * Guild member directory.
 *
 * Auth: Bearer token from the caller's Supabase session — REQUIRED.
 * This route used to be unauthenticated and returned every onboarded
 * profile (name, role, plan) to anyone who asked. Member data is only
 * served to signed-in users now.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, getServerSupabase, requireApiUser } from "@/lib/supabase-server";

export type GuildMember = {
  id: string;
  artistName: string;
  role: string;
  genre: string;
  plan: string;
  joinedAt: string;
};

export async function GET(req: NextRequest) {
  // Preserve the page's "Guild not connected" state when Supabase env is
  // absent — no query runs in that branch, so nothing leaks.
  if (!getAdminSupabase() || !getServerSupabase()) {
    return NextResponse.json({ members: [], configured: false });
  }

  const auth = await requireApiUser(req);
  if (auth.response) return auth.response;

  const { data, error } = await auth.admin
    .from("profiles")
    .select("id, artist_name, role, vibe, plan, created_at")
    .eq("onboarded", true)
    .not("artist_name", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[guild/members] Supabase error:", error.message);
    return NextResponse.json({ members: [], configured: true, error: "Failed to load members" });
  }

  const members: GuildMember[] = (data ?? []).map((row) => ({
    id: row.id as string,
    artistName: (row.artist_name as string) ?? "Artist",
    role: (row.role as string) ?? "Artist",
    genre: (row.vibe as string) ?? "Music",
    plan: (row.plan as string) ?? "free",
    joinedAt: row.created_at as string,
  }));

  return NextResponse.json({ members, configured: true });
}
