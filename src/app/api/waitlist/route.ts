import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Server-side client uses the anon key + Supabase's RLS policy for public insert
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string; artistName?: string; source?: string };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required." }, { status: 400 });
    }

    const { error } = await supabase.from("waitlist").insert({
      email,
      artist_name: typeof body.artistName === "string" ? body.artistName.trim() : null,
      source: typeof body.source === "string" ? body.source : "landing",
    });

    // Duplicate email is fine — just acknowledge
    if (error && !error.message.includes("duplicate")) {
      console.error("Waitlist insert error:", error.message);
      return NextResponse.json({ error: "Could not save. Try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
