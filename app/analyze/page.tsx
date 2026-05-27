"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/error-state"
import { HistorySidebar } from "@/components/history-sidebar"
import { ReportLoadingState } from "@/components/loading-state"
import { Report } from "@/components/report"
import {
  getReportById,
  hashContent,
  saveReport,
  updateReportRewrites,
} from "@/lib/history"
import type { RewriteBlock } from "@/types/rewrite"
import type { ScoreResult } from "@/types/score"

type AnalysisInput =
  | { mode: "url"; url: string }
  | { mode: "paste"; content: string }

export default function AnalyzePage() {
  const router = useRouter()
  const [score, setScore] = useState<ScoreResult | null>(null)
  const [rewrites, setRewrites] = useState<RewriteBlock[] | null>(null)
  const [rewritesLoading, setRewritesLoading] = useState(false)
  const [error, setError] = useState<{ title: string; message: string } | null>(null)
  const [meta, setMeta] = useState<{ title?: string; url?: string }>({})
  const [stage, setStage] = useState("Loading…")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get("session")
    const reportId = params.get("report")

    if (reportId) {
      const cached = getReportById(reportId)
      if (!cached) {
        setError({
          title: "Report not found",
          message: "This analysis is no longer in your history.",
        })
        return
      }
      setMeta({ title: cached.title, url: cached.url })
      setScore(cached.score)
      setRewrites(cached.rewrites)
      return
    }

    if (!sessionId) {
      router.replace("/")
      return
    }

    const raw = sessionStorage.getItem(`citationiq:${sessionId}`)
    if (!raw) {
      setError({
        title: "Analysis session not found",
        message: "Start a new analysis to continue.",
      })
      return
    }
    let input: AnalysisInput
    try {
      input = JSON.parse(raw) as AnalysisInput
    } catch {
      setError({
        title: "Session corrupted",
        message: "The stored analysis input could not be read. Start a new analysis.",
      })
      return
    }

    let cancelled = false

    async function run() {
      try {
        let content: string
        let title: string | undefined
        let url: string | undefined

        if (input.mode === "url") {
          setStage("Fetching article…")
          const res = await fetch("/api/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: input.url }),
          })
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as { error?: string }
            throw new Error(body.error || `Extraction failed (HTTP ${res.status})`)
          }
          const article = (await res.json()) as {
            markdown: string
            textContent: string
            title: string
            url: string
          }
          if (cancelled) return
          content = article.markdown || article.textContent
          title = article.title || undefined
          url = article.url
        } else {
          content = input.content
        }

        setMeta({ title, url })
        setStage("Analyzing content with Claude…")

        const analyzeRes = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, title, url }),
        })
        if (!analyzeRes.ok) {
          const body = (await analyzeRes.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error || `Analysis failed (HTTP ${analyzeRes.status})`)
        }
        const scoreResult = (await analyzeRes.json()) as ScoreResult
        if (cancelled) return
        setScore(scoreResult)

        const id = await hashContent(content)
        saveReport({ id, url, title, score: scoreResult, rewrites: null })
        window.history.replaceState(null, "", `/analyze?report=${id}`)

        setRewritesLoading(true)
        setStage("Generating rewrites…")

        const rewriteRes = await fetch("/api/rewrite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, title, url, score: scoreResult }),
        })
        if (cancelled) return
        setRewritesLoading(false)
        if (!rewriteRes.ok) {
          console.error("rewrites failed; report will render without them")
          return
        }
        const rewriteResult = (await rewriteRes.json()) as { rewrites: RewriteBlock[] }
        if (cancelled) return
        setRewrites(rewriteResult.rewrites)
        updateReportRewrites(id, rewriteResult.rewrites)
      } catch (err) {
        if (cancelled) return
        setError({
          title: "Analysis failed",
          message: err instanceof Error ? err.message : "Unexpected error",
        })
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-5xl py-10">
        <header className="mb-8 flex items-center justify-between">
          <a href="/" className="text-2xl font-semibold tracking-tight">
            CitationIQ
          </a>
          <div className="flex items-center gap-2">
            <HistorySidebar />
            <Button variant="outline" size="sm" onClick={() => router.push("/")}>
              New analysis
            </Button>
          </div>
        </header>

        {error ? (
          <ErrorState
            title={error.title}
            message={error.message}
            onRetry={() => router.push("/")}
            retryLabel="Start over"
          />
        ) : score === null ? (
          <ReportLoadingState stage={stage} />
        ) : (
          <Report
            score={score}
            rewrites={rewrites}
            rewritesLoading={rewritesLoading}
            meta={meta}
          />
        )}
      </div>
    </main>
  )
}
