import { z } from "zod"

export const DIMENSION_KEYS = [
  "entityCoverage",
  "definitionClarity",
  "structuredFormatting",
  "aiReadability",
  "topicalCompleteness",
  "trustSignals",
  "faqCoverage",
] as const

export type DimensionKey = (typeof DIMENSION_KEYS)[number]

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  entityCoverage: "Entity Coverage",
  definitionClarity: "Definition Clarity",
  structuredFormatting: "Structured Formatting",
  aiReadability: "AI Readability",
  topicalCompleteness: "Topical Completeness",
  trustSignals: "Trust Signals",
  faqCoverage: "FAQ Coverage",
}

const dimensionResultSchema = z.object({
  score: z.number().min(0).max(100),
  reasoning: z.string().min(1),
  fixes: z.array(z.string().min(1)).min(1).max(5),
})

export type DimensionResult = z.infer<typeof dimensionResultSchema>

export const scoreResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  dimensions: z.object({
    entityCoverage: dimensionResultSchema,
    definitionClarity: dimensionResultSchema,
    structuredFormatting: dimensionResultSchema,
    aiReadability: dimensionResultSchema,
    topicalCompleteness: dimensionResultSchema,
    trustSignals: dimensionResultSchema,
    faqCoverage: dimensionResultSchema,
  }),
  detectedEntities: z.array(z.string().min(1)).max(20),
  topFixes: z.array(z.string().min(1)).min(1).max(6),
  summary: z.string().min(1),
})

export type ScoreResult = z.infer<typeof scoreResultSchema>

export const analyzeRequestSchema = z.object({
  content: z.string().min(100, "content must be at least 100 characters"),
  title: z.string().optional(),
  url: z.string().optional(),
})

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>
