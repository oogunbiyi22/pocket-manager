import { generateText, type LanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

const AnalyzeSchema = z.object({
  text: z.string().min(50).max(15000),
  contractType: z.string().max(80).optional(),
});

function getModel(): LanguageModel {
  const provider = process.env.AI_PROVIDER ?? "groq";
  if (provider === "ollama") {
    const baseURL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1";
    return createOpenAI({ baseURL, apiKey: "ollama" })(process.env.AI_MODEL ?? "qwen3.5:9b") as unknown as LanguageModel;
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return createAnthropic()("claude-haiku-4-5-20251001") as unknown as LanguageModel;
  }
  return createGroq({ apiKey: process.env.GROQ_API_KEY })("llama-3.3-70b-versatile") as unknown as LanguageModel;
}

const SYSTEM = `You are a music industry contract analyst with deep expertise in entertainment law.
You help independent artists understand their contracts WITHOUT replacing legal counsel.

When analyzing a contract, extract every risky or notable clause and return ONLY valid JSON.
No markdown, no explanation outside the JSON.

Return this exact shape:
{
  "summary": "2-3 sentence plain-English overview of what this contract does",
  "overallRisk": "Low" | "Medium" | "High" | "Critical",
  "flags": [
    {
      "label": "short clause name",
      "risk": "Low" | "Medium" | "High" | "Critical",
      "excerpt": "verbatim quote from the contract (max 200 chars)",
      "plainEnglish": "what this means for the artist in simple terms",
      "attorneyQuestion": "the single most important question to ask a lawyer about this clause"
    }
  ],
  "positives": ["any artist-friendly clauses worth noting"],
  "nextSteps": ["3-5 concrete action items before signing"]
}

Flag these red flags aggressively:
- Perpetuity / forever / throughout the universe
- 360-degree provisions (label taking % of touring, merch, publishing)
- Audit right waivers
- All-in deals or broad recoupment
- Missing reversion clauses
- Exclusive agreements with no out clause
- Work-for-hire language on master recordings
- Publishing co-admin or admin control grabs
- Unilateral contract extension options
- No release commitment (label can shelf the artist)
- Cross-collateralization across albums/streams
`;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`contracts:${ip}`, RATE_LIMITS.chat.limit, RATE_LIMITS.chat.windowMs);
  if (!rl.ok) {
    return NextResponse.json({ error: rl.message }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSeconds) },
    });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = AnalyzeSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Send { text, contractType } with at least 50 chars of contract text." }, { status: 400 });
  }

  const { text, contractType } = parsed.data;

  try {
    const { text: reply } = await generateText({
      model: getModel(),
      system: SYSTEM,
      prompt: `Contract type: ${contractType ?? "Music agreement"}\n\nContract text:\n${text}`,
      maxOutputTokens: 1200,
      temperature: 0.2,
    });

    // Extract JSON from response (model might wrap in code block)
    const jsonMatch = reply.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI could not parse this contract." }, { status: 422 });
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("[contracts] AI error:", err instanceof Error ? err.message : "Unknown");
    return NextResponse.json({ error: "Analysis failed — try again." }, { status: 500 });
  }
}
