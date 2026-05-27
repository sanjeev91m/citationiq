import { NextResponse } from "next/server"
import { RewriteError, generateRewrites } from "@/lib/rewrite"
import { rewriteRequestSchema } from "@/types/rewrite"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = rewriteRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  try {
    const result = await generateRewrites(parsed.data)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof RewriteError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    if (err instanceof Error && err.message.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        { error: "Server is not configured with an Anthropic API key" },
        { status: 500 }
      )
    }
    console.error("rewrite route unexpected error", err)
    return NextResponse.json({ error: "Unexpected error during rewrite generation" }, { status: 500 })
  }
}
