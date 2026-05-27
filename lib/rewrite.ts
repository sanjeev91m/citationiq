import { REWRITE_MODEL, getAnthropicClient } from "@/lib/anthropic"
import {
  REWRITE_SYSTEM_PROMPT,
  REWRITE_TOOL_INPUT_SCHEMA,
  REWRITE_TOOL_NAME,
  buildRewriteUserPrompt,
} from "@/lib/rewrite-prompt"
import { MAX_INPUT_CHARS, TRUNCATION_MARKER } from "@/lib/scoring-prompt"
import type { ScoreResult } from "@/types/score"
import { rewriteResultSchema, type RewriteResult } from "@/types/rewrite"

export class RewriteError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = "RewriteError"
  }
}

function truncate(content: string): string {
  if (content.length <= MAX_INPUT_CHARS) return content
  return content.slice(0, MAX_INPUT_CHARS) + TRUNCATION_MARKER
}

export async function generateRewrites(args: {
  content: string
  score: ScoreResult
  title?: string
  url?: string
}): Promise<RewriteResult> {
  const anthropic = getAnthropicClient()
  const content = truncate(args.content)

  const response = await anthropic.messages.create({
    model: REWRITE_MODEL,
    max_tokens: 3000,
    temperature: 0.3,
    system: REWRITE_SYSTEM_PROMPT,
    tools: [
      {
        name: REWRITE_TOOL_NAME,
        description: "Submit the rewrite blocks for the article.",
        input_schema: REWRITE_TOOL_INPUT_SCHEMA as never,
      },
    ],
    tool_choice: { type: "tool", name: REWRITE_TOOL_NAME },
    messages: [
      {
        role: "user",
        content: buildRewriteUserPrompt({ ...args, content }),
      },
    ],
  })

  const toolUse = response.content.find((block) => block.type === "tool_use")
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new RewriteError(502, "Model did not return a tool_use block")
  }

  const parsed = rewriteResultSchema.safeParse(toolUse.input)
  if (!parsed.success) {
    console.error("rewrite schema validation failed", parsed.error.issues)
    throw new RewriteError(502, "Model returned a result that did not match the expected schema")
  }

  return parsed.data
}
