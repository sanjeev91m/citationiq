"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Report } from "@/components/report"
import type { ScoreResult } from "@/types/score"
import type { RewriteBlock } from "@/types/rewrite"

type AnalysisInput =
  | { mode: "url"; url: string }
  | { mode: "paste"; content: string }

export default function AnalyzePage() {
  const router = useRouter()
  const [score, setScore] = useState<ScoreResult | null>(null)
  const [rewrites, setRewrites] = useState<RewriteBlock[] | null>(null)
  const [rewritesLoading, setRewritesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ title?: string; url?: string }>({})
  const [stage, setStage] = useState("Loading…")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get("id")
    if (!id) {
      router.replace("/")
      return
    }

    const raw = sessionStorage.getItem(`citationiq:${id}`)
    if (!raw) {
      setError("Analysis session not found. Start a new analysis.")
      return
    }
    let input: AnalysisInput
    try {
      input = JSON.parse(raw) as AnalysisInput
    } catch {
      setError("Analysis session is corrupted. Start a new analysis.")
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
            textContent: string
            title: string
            url: string
          }
          if (cancelled) return
          content = article.textContent
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
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Unexpected error")
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
          <Button variant="outline" size="sm" onClick={() => router.push("/")}>
            New analysis
          </Button>
        </header>

        {error ? (
          <Card>
            <CardContent className="space-y-4 py-10 text-center">
              <p className="text-base text-destructive">{error}</p>
              <Button onClick={() => router.push("/")}>Start over</Button>
            </CardContent>
          </Card>
        ) : score === null ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{stage}</p>
              <p className="text-xs text-muted-foreground">This usually takes 20-40 seconds.</p>
            </CardContent>
          </Card>
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
