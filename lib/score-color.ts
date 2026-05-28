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

const PRIORITY_CLASSES = {
  critical: {
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  high: {
    text: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  medium: {
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  low: {
    text: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
} as const

export type Priority = keyof typeof PRIORITY_CLASSES

export function priorityClasses(priority: Priority) {
  return PRIORITY_CLASSES[priority]
}
