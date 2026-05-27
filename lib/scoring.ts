import { SCORING_MODEL, getAnthropicClient } from "@/lib/anthropic"
import {
  MAX_INPUT_CHARS,
  SCORE_TOOL_INPUT_SCHEMA,
  SCORE_TOOL_NAME,
  SCORING_SYSTEM_PROMPT,
  TRUNCATION_MARKER,
  buildScoringUserPrompt,
} from "@/lib/scoring-prompt"
import { scoreResultSchema, type ScoreResult } from "@/types/score"

export class ScoringError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = "ScoringError"
  }
}

function truncate(content: string): string {
  if (content.length <= MAX_INPUT_CHARS) return content
  return content.slice(0, MAX_INPUT_CHARS) + TRUNCATION_MARKER
}

export async function scoreArticle(args: {
  content: string
  title?: string
  url?: string
}): Promise<ScoreResult> {
  const anthropic = getAnthropicClient()
  const content = truncate(args.content)

  const response = await anthropic.messages.create({
    model: SCORING_MODEL,
    max_tokens: 4000,
    temperature: 0,
    system: SCORING_SYSTEM_PROMPT,
    tools: [
      {
        name: SCORE_TOOL_NAME,
        description: "Submit the structured AI citation readiness score for the article.",
        input_schema: SCORE_TOOL_INPUT_SCHEMA as never,
      },
    ],
    tool_choice: { type: "tool", name: SCORE_TOOL_NAME },
    messages: [
      {
        role: "user",
        content: buildScoringUserPrompt({ ...args, content }),
      },
    ],
  })

  const toolUse = response.content.find((block) => block.type === "tool_use")
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new ScoringError(502, "Model did not return a tool_use block")
  }

  const parsed = scoreResultSchema.safeParse(toolUse.input)
  if (!parsed.success) {
    console.error("scoring schema validation failed", parsed.error.issues)
    throw new ScoringError(502, "Model returned a result that did not match the expected schema")
  }

  return parsed.data
}
