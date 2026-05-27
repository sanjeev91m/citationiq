import type { ScoreResult } from "@/types/score"
import type { RewriteBlock } from "@/types/rewrite"

export type StoredReport = {
  id: string
  url?: string
  title?: string
  score: ScoreResult
  rewrites: RewriteBlock[] | null
  createdAt: number
}
