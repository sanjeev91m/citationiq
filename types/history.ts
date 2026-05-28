import type { ScoreResult } from "@/types/score"

export type StoredReport = {
  id: string
  url?: string
  title?: string
  score: ScoreResult
  createdAt: number
}
