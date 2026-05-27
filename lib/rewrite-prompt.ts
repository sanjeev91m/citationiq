import { DIMENSION_KEYS, DIMENSION_LABELS, type ScoreResult } from "@/types/score"

export const REWRITE_SYSTEM_PROMPT = `You are an AI Citation Readiness Editor.

You receive an article and a score report that rates it on seven dimensions:
- Entity Coverage
- Definition Clarity
- Structured Formatting
- AI Readability
- Topical Completeness
- Trust Signals
- FAQ Coverage

Your job is to select 3-5 specific passages from the article whose rewriting would most improve the article's chances of being cited by AI engines (ChatGPT, Claude, Gemini, Perplexity).

For each rewrite:
- originalSnippet: a verbatim passage copied from the article. A sentence, a short paragraph, or a heading plus its opening sentence. Up to ~400 characters. If the passage you want to fix is longer, copy the most representative ~400 chars verbatim. Do not paraphrase the original — it must be findable in the article.
- rewrittenSnippet: an improved version that addresses a specific weak dimension. Preserve the author's meaning and topic. Make it tight, scannable, and citation-friendly.
- targetDimension: the single dimension this rewrite most improves (one of the seven keys).
- reason: one sentence explaining why this rewrite improves that dimension.

Guidelines:
- Focus on the lowest-scoring dimensions. Do not waste rewrites on already-strong areas.
- Spread rewrites across multiple weak dimensions when possible. Avoid five rewrites all targeting the same dimension when three dimensions are weak.
- Each rewrite must target ONE primary dimension.
- Do not fabricate facts, statistics, sources, expert quotes, or dates. Only restructure, clarify, or tighten content that's already in the article. If a dimension is weak primarily because content is MISSING (e.g., Trust Signals lacks citations the article doesn't have), pick a different dimension where you can rewrite existing content.
- Prefer rewriting a real, specific passage over inventing a generic example.
- Keep rewrittenSnippet roughly the same length as originalSnippet, or shorter. Do not balloon the article.

Submit your result by calling the submit_rewrites tool. Do not include any other text in your response.`

export function buildRewriteUserPrompt(args: {
  content: string
  score: ScoreResult
  title?: string
  url?: string
}): string {
  const header: string[] = []
  if (args.title) header.push(`Title: ${args.title}`)
  if (args.url) header.push(`URL: ${args.url}`)
  const headerBlock = header.length > 0 ? header.join("\n") + "\n\n" : ""

  const ranked = [...DIMENSION_KEYS].sort(
    (a, b) => args.score.dimensions[a].score - args.score.dimensions[b].score
  )

  const dimSummary = ranked
    .map((k) => {
      const d = args.score.dimensions[k]
      return `- ${DIMENSION_LABELS[k]} (${k}): ${d.score}/100 — ${d.reasoning}`
    })
    .join("\n")

  return `${headerBlock}Overall score: ${args.score.overallScore}/100

Dimension scores (sorted weakest first — address the weakest ones first):
${dimSummary}

Article content:
---
${args.content}
---

Select 3-5 passages from the article whose rewriting would most improve AI citation readiness, focusing on the weakest dimensions above. Call submit_rewrites with your structured result.`
}

export const REWRITE_TOOL_NAME = "submit_rewrites"

export const REWRITE_TOOL_INPUT_SCHEMA = {
  type: "object",
  required: ["rewrites"],
  properties: {
    rewrites: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        required: ["originalSnippet", "rewrittenSnippet", "targetDimension", "reason"],
        properties: {
          originalSnippet: {
            type: "string",
            description: "Verbatim passage from the article, up to ~400 characters.",
          },
          rewrittenSnippet: {
            type: "string",
            description: "Improved version. Preserve meaning. Tight, scannable, citation-friendly.",
          },
          targetDimension: {
            type: "string",
            enum: [...DIMENSION_KEYS],
            description: "The single dimension this rewrite most improves.",
          },
          reason: {
            type: "string",
            description: "One sentence: why this rewrite helps the target dimension.",
          },
        },
      },
    },
  },
}
