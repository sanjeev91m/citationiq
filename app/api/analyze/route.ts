import { NextResponse } from "next/server"
import { ScoringError, scoreArticle } from "@/lib/scoring"
import { analyzeRequestSchema } from "@/types/score"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = analyzeRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  try {
    const result = await scoreArticle(parsed.data)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof ScoringError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    if (err instanceof Error && err.message.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        { error: "Server is not configured with an Anthropic API key" },
        { status: 500 }
      )
    }
    console.error("analyze route unexpected error", err)
    return NextResponse.json({ error: "Unexpected error during analysis" }, { status: 500 })
  }
}
