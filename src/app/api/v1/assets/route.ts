import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import type { SongVaultAsset, SongVaultAssetKind } from "@/lib/backstage-data";

const BUCKET = "vault-assets";

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get("Authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null;
}

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/(^-|-$)+/g, "");
}

function classifyAsset(fileName: string, mimeType: string): SongVaultAssetKind {
  if (/image\//i.test(mimeType) || /cover|art|photo|image/i.test(fileName)) return "artwork";
  if (/audio\//i.test(mimeType) || /master|wav|mp3|stem|mix/i.test(fileName)) return "master";
  if (/split/i.test(fileName)) return "split";
  if (/contract|agreement|license/i.test(fileName)) return "contract";
  return "other";
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${bytes} B`;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`assets:write:${ip}`, 20, RATE_LIMITS.api.windowMs);
  if (!rl.ok) {
    return NextResponse.json({ error: rl.message }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSeconds) },
    });
  }

  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: "Vault storage is not configured" }, { status: 503 });
  }

  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: { user }, error: authError } = await anon.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const formData = await req.formData();
  const songId = formData.get("songId");
  const fileEntries = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

  if (typeof songId !== "string" || !songId.trim()) {
    return NextResponse.json({ error: "songId is required" }, { status: 400 });
  }

  if (fileEntries.length === 0) {
    return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
  }

  const assets: SongVaultAsset[] = [];

  for (const file of fileEntries) {
    if (file.size === 0) {
      continue;
    }

    const safeName = sanitizeFileName(file.name || "asset");
    const storagePath = `${user.id}/${songId}/${Date.now()}-${safeName}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      const message = /bucket/i.test(uploadError.message)
        ? `Supabase bucket \"${BUCKET}\" is missing`
        : uploadError.message;
      return NextResponse.json({ error: message }, { status: 500 });
    }

    assets.push({
      id: `${songId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      kind: classifyAsset(file.name, file.type),
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      sizeLabel: formatSize(file.size),
      uploadedAt: new Date().toISOString(),
      source: "supabase",
      storagePath,
    });
  }

  if (assets.length === 0) {
    return NextResponse.json({ error: "No valid files uploaded" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, assets });
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`assets:read:${ip}`, RATE_LIMITS.api.limit, RATE_LIMITS.api.windowMs);
  if (!rl.ok) {
    return NextResponse.json({ error: rl.message }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSeconds) },
    });
  }

  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: "Vault storage is not configured" }, { status: 503 });
  }

  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: { user }, error: authError } = await anon.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const requestedPath = req.nextUrl.searchParams.get("path")?.trim();
  const download = req.nextUrl.searchParams.get("download") === "1";

  if (!requestedPath) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  if (!requestedPath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(requestedPath, 60, {
    download,
  });

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? "Could not create file URL" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: data.signedUrl });
}
