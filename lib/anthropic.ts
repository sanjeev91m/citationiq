import Anthropic from "@anthropic-ai/sdk"

export const SCORING_MODEL = "claude-opus-4-5"
export const REWRITE_MODEL = "claude-sonnet-4-5"

let cachedClient: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (cachedClient) return cachedClient
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set")
  }
  cachedClient = new Anthropic({ apiKey })
  return cachedClient
}
