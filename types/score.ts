import { z } from "zod"

export const DIMENSION_KEYS = [
  "structure",
  "extractability",
  "directAnswers",
  "trustSignals",
  "tablesStructuredData",
  "recommendationClarity",
  "entityClarity",
  "freshness",
  "faqSupportingAnswers",
] as const

export type DimensionKey = (typeof DIMENSION_KEYS)[number]

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  structure: "Structure",
  extractability: "Extractability",
  directAnswers: "Direct Answers",
  trustSignals: "Trust Signals",
  tablesStructuredData: "Tables & Structured Data",
  recommendationClarity: "Recommendation Clarity",
  entityClarity: "Entity Clarity",
  freshness: "Freshness",
  faqSupportingAnswers: "FAQ & Supporting Answers",
}

export const DIMENSION_WEIGHTS: Record<DimensionKey, number> = {
  structure: 0.15,
  extractability: 0.2,
  directAnswers: 0.15,
  trustSignals: 0.1,
  tablesStructuredData: 0.1,
  recommendationClarity: 0.1,
  entityClarity: 0.1,
  freshness: 0.05,
  faqSupportingAnswers: 0.05,
}

export const PAGE_TYPES = [
  "news",
  "review",
  "comparison",
  "bestListicle",
  "pdpSpecsPrice",
  "howToTutorial",
  "benchmarkTesting",
  "factFaq",
  "buyingGuide",
  "timelineHistory",
  "dealOffer",
  "categoryCatalog",
  "toolUtility",
] as const

export type PageType = (typeof PAGE_TYPES)[number]

export const PAGE_TYPE_LABELS: Record<PageType, string> = {
  news: "News",
  review: "Review",
  comparison: "Comparison",
  bestListicle: "Best Listicle",
  pdpSpecsPrice: "Product / Specs",
  howToTutorial: "How-to / Tutorial",
  benchmarkTesting: "Benchmark / Testing",
  factFaq: "Fact / FAQ",
  buyingGuide: "Buying Guide",
  timelineHistory: "Timeline / History",
  dealOffer: "Deal / Offer",
  categoryCatalog: "Category / Catalog",
  toolUtility: "Tool / Utility",
}

export const INTENTS = [
  "informational",
  "recommendation",
  "comparison",
  "evaluation",
  "transactional",
  "specificFact",
  "freshnessNews",
  "troubleshooting",
  "availability",
] as const

export type Intent = (typeof INTENTS)[number]

export const INTENT_LABELS: Record<Intent, string> = {
  informational: "Informational",
  recommendation: "Recommendation",
  comparison: "Comparison",
  evaluation: "Evaluation",
  transactional: "Transactional",
  specificFact: "Specific Fact",
  freshnessNews: "Freshness / News",
  troubleshooting: "Troubleshooting",
  availability: "Availability",
}

export const PRIORITY_LEVELS = ["critical", "high", "medium", "low"] as const
export type Priority = (typeof PRIORITY_LEVELS)[number]

export const PRIORITY_LABELS: Record<Priority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
}

const dimensionResultSchema = z.object({
  score: z.number().min(0).max(100),
  reasoning: z.string().min(1),
})

export type DimensionResult = z.infer<typeof dimensionResultSchema>

const fixSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(PRIORITY_LEVELS),
})

export type Fix = z.infer<typeof fixSchema>

export const scoreResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  pageType: z.enum(PAGE_TYPES),
  intent: z.enum(INTENTS),
  dimensions: z.object({
    structure: dimensionResultSchema,
    extractability: dimensionResultSchema,
    directAnswers: dimensionResultSchema,
    trustSignals: dimensionResultSchema,
    tablesStructuredData: dimensionResultSchema,
    recommendationClarity: dimensionResultSchema,
    entityClarity: dimensionResultSchema,
    freshness: dimensionResultSchema,
    faqSupportingAnswers: dimensionResultSchema,
  }),
  strengths: z.array(z.string().min(1)).min(3).max(5),
  weaknesses: z.array(z.string().min(1)).min(3).max(5),
  fixes: z.array(fixSchema).min(3).max(10),
  estimatedImpact: z.enum(["high", "medium", "low"]),
  summary: z.string().min(1),
})

export type ScoreResult = z.infer<typeof scoreResultSchema>
export type EstimatedImpact = ScoreResult["estimatedImpact"]

export const analyzeRequestSchema = z.object({
  content: z.string().min(100, "content must be at least 100 characters"),
  title: z.string().optional(),
  url: z.string().optional(),
})

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>
