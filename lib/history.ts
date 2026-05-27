import type { RewriteBlock } from "@/types/rewrite"
import type { ScoreResult } from "@/types/score"
import type { StoredReport } from "@/types/history"

const STORAGE_KEY = "citationiq:history"
const MAX_ENTRIES = 10

function read(): StoredReport[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as StoredReport[]
  } catch {
    return []
  }
}

function write(items: StoredReport[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (err) {
    console.error("history write failed", err)
  }
}

export async function hashContent(text: string): Promise<string> {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim()
  const data = new TextEncoder().encode(normalized)
  const buf = await crypto.subtle.digest("SHA-1", data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export function getRecentReports(): StoredReport[] {
  return read().sort((a, b) => b.createdAt - a.createdAt)
}

export function getReportById(id: string): StoredReport | null {
  return read().find((r) => r.id === id) ?? null
}

export function saveReport(report: {
  id: string
  url?: string
  title?: string
  score: ScoreResult
  rewrites: RewriteBlock[] | null
}) {
  const items = read().filter((r) => r.id !== report.id)
  items.unshift({ ...report, createdAt: Date.now() })
  write(items.slice(0, MAX_ENTRIES))
}

export function updateReportRewrites(id: string, rewrites: RewriteBlock[]) {
  const items = read()
  const idx = items.findIndex((r) => r.id === id)
  if (idx === -1) return
  items[idx] = { ...items[idx], rewrites }
  write(items)
}

export function clearHistory() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
}
