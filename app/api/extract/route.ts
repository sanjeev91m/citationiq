import { NextResponse } from "next/server"
import { ExtractError, extractFromHtml, extractFromUrl } from "@/lib/extract"
import { extractRequestSchema } from "@/types/extract"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = extractRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  try {
    const article =
      "url" in parsed.data
        ? await extractFromUrl(parsed.data.url)
        : extractFromHtml(parsed.data.html, "")
    return NextResponse.json(article)
  } catch (err) {
    if (err instanceof ExtractError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error("extract route unexpected error", err)
    return NextResponse.json({ error: "Unexpected error during extraction" }, { status: 500 })
  }
}
