import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-server";

export type GuildMember = {
  id: string;
  artistName: string;
  role: string;
  genre: string;
  plan: string;
  joinedAt: string;
};

export async function GET() {
  const supabase = getAdminSupabase();

  if (!supabase) {
    return NextResponse.json({ members: [], configured: false });
  }

  const { data, error } = await supabase
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
