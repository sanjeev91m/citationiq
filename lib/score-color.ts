export type ScoreTier = "low" | "mid" | "high"

export function scoreTier(score: number): ScoreTier {
  if (score >= 80) return "high"
  if (score >= 60) return "mid"
  return "low"
}

const TIER_CLASSES = {
  low: {
    text: "text-red-600",
    bgSoft: "bg-red-50",
    border: "border-red-200",
    progress: "bg-red-500",
    stroke: "stroke-red-500",
  },
  mid: {
    text: "text-amber-600",
    bgSoft: "bg-amber-50",
    border: "border-amber-200",
    progress: "bg-amber-500",
    stroke: "stroke-amber-500",
  },
  high: {
    text: "text-emerald-600",
    bgSoft: "bg-emerald-50",
    border: "border-emerald-200",
    progress: "bg-emerald-500",
    stroke: "stroke-emerald-500",
  },
} as const

export function scoreClasses(score: number) {
  return TIER_CLASSES[scoreTier(score)]
}
