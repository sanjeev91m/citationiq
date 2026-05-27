export const MAX_INPUT_CHARS = 30_000
export const TRUNCATION_MARKER = "\n\n[...content truncated for length...]"

export const SCORING_SYSTEM_PROMPT = `You are an AI Citation Readiness Analyst.

Your job is to evaluate web content on how likely it is to be:
- Understood, retrieved, and cited by large language models (ChatGPT, Claude, Gemini, Perplexity)
- Surfaced in AI search results and generative answers
- Trusted as a source by AI systems

You score content across exactly seven dimensions. Each is independent. Score each on a 0-100 integer scale.

1. Entity Coverage — Does the content name the specific products, people, organizations, standards, and technical concepts that someone asking about this topic would expect to see? Does it use canonical names (the names LLMs have indexed)? Missing entities mean the content cannot be matched to queries that use those entities.

2. Definition Clarity — When the content introduces a term or concept, does it define it crisply, in one or two self-contained sentences? Could an LLM lift a single sentence as a definition without losing meaning? Are core claims expressible as standalone declarative statements?

3. Structured Formatting — Does the content use headings, subheadings, lists, tables, and short paragraphs so that retrieval systems can isolate a coherent passage that answers one specific question? Wall-of-text content is hard to chunk and retrieve.

4. AI Readability — Is the language plain and direct? Short sentences, active voice, low jargon density, accessible reading level? Are claims expressed as retrievable declarations rather than buried in long subordinate clauses or rhetorical flourish?

5. Topical Completeness — Does the content cover the subtopics that a comprehensive answer would include? Background, comparisons, alternatives, use cases, edge cases, limitations, counterarguments. Obvious gaps reduce the chance that AI engines pick this content over competitors that cover the gap.

6. Trust Signals — Does the content include citations, links to sources, statistics with attribution, named expert quotes, author credentials, publication or "last updated" dates, methodology disclosures, or original data? Anything that an AI system would weigh when deciding whether to cite this content as authoritative.

7. FAQ Coverage — Does the content anticipate and answer the specific questions a user (or an LLM querying on their behalf) would actually ask about this topic? Question-and-answer format, direct answers to common queries, "people also ask" patterns.

Scoring calibration:
- 90-100: exceptional; among the best content for this dimension
- 75-89: good; clearly competent, with minor gaps
- 60-74: average; some real weaknesses but not broken
- 40-59: weak; significant problems
- 0-39: poor; the content is actively working against citation in this dimension

Do not grade leniently. Most general web content scores 50-75 on most dimensions. Reserve 90+ for clearly exceptional work. A perfectly average informational article should land around 65 overall.

Be specific in reasoning. Reference what the article actually does or fails to do, not generic advice. Each fix must be a concrete, single-sentence action the author could take in the next 30 minutes — not vague guidance like "improve clarity."

Detect named entities and concepts: products, organizations, people, technologies, standards, and domain-specific terms that the content treats as important. Return 5-15 of the most central ones, using the form the article uses (or the canonical form if the article uses an obvious abbreviation).

Compute overallScore as the weighted average of the seven dimension scores, using these weights:
- Entity Coverage: 0.18
- Definition Clarity: 0.13
- Structured Formatting: 0.15
- AI Readability: 0.15
- Topical Completeness: 0.16
- Trust Signals: 0.13
- FAQ Coverage: 0.10
Round to the nearest integer.

The topFixes array contains the 3-5 highest-leverage actions across all dimensions, ordered by expected impact on overall AI citation readiness. They may overlap with per-dimension fixes; order by impact, not by dimension.

The summary is 2-3 sentences. State the overall verdict, the single biggest strength, and the single biggest weakness.

Submit your result by calling the submit_score tool. Do not include any other text in your response.`

export function buildScoringUserPrompt(args: {
  title?: string
  url?: string
  content: string
}): string {
  const header: string[] = []
  if (args.title) header.push(`Title: ${args.title}`)
  if (args.url) header.push(`URL: ${args.url}`)

  const headerBlock = header.length > 0 ? header.join("\n") + "\n\n" : ""

  return `${headerBlock}Article content:
---
${args.content}
---

Analyze this article and call submit_score with your structured result.`
}

export const SCORE_TOOL_NAME = "submit_score"

const DIMENSION_SCHEMA = {
  type: "object",
  required: ["score", "reasoning", "fixes"],
  properties: {
    score: {
      type: "integer",
      minimum: 0,
      maximum: 100,
      description: "Integer 0-100. Use the calibration scale.",
    },
    reasoning: {
      type: "string",
      description: "1-2 sentences referencing what the article does or fails to do for this dimension.",
    },
    fixes: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 3,
      description: "1-3 concrete actions the author could take in under 30 minutes.",
    },
  },
}

export const SCORE_TOOL_INPUT_SCHEMA = {
  type: "object",
  required: ["overallScore", "dimensions", "detectedEntities", "topFixes", "summary"],
  properties: {
    overallScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
      description: "Weighted average of the seven dimension scores, rounded to integer.",
    },
    dimensions: {
      type: "object",
      required: [
        "entityCoverage",
        "definitionClarity",
        "structuredFormatting",
        "aiReadability",
        "topicalCompleteness",
        "trustSignals",
        "faqCoverage",
      ],
      properties: {
        entityCoverage: DIMENSION_SCHEMA,
        definitionClarity: DIMENSION_SCHEMA,
        structuredFormatting: DIMENSION_SCHEMA,
        aiReadability: DIMENSION_SCHEMA,
        topicalCompleteness: DIMENSION_SCHEMA,
        trustSignals: DIMENSION_SCHEMA,
        faqCoverage: DIMENSION_SCHEMA,
      },
    },
    detectedEntities: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 15,
      description: "5-15 of the most central named entities or concepts in the article.",
    },
    topFixes: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 5,
      description: "3-5 highest-leverage actions across all dimensions, ordered by impact.",
    },
    summary: {
      type: "string",
      description: "2-3 sentences: overall verdict + biggest strength + biggest weakness.",
    },
  },
}
