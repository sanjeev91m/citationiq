import { Card, CardContent } from "@/components/ui/card"
import { DimensionCard } from "@/components/dimension-card"
import { IntentBadge } from "@/components/intent-badge"
import { PageTypeBadge } from "@/components/page-type-badge"
import { PrioritizedFixes } from "@/components/prioritized-fixes"
import { ScoreGauge } from "@/components/score-gauge"
import { DIMENSION_KEYS, type ScoreResult } from "@/types/score"

const IMPACT_LABELS: Record<ScoreResult["estimatedImpact"], string> = {
  high: "High impact",
  medium: "Medium impact",
  low: "Low impact",
}

export function Report({
  score,
  meta,
}: {
  score: ScoreResult
  meta: { title?: string; url?: string }
}) {
  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="flex flex-col items-center gap-8 py-8 md:flex-row md:items-start md:gap-12">
          <ScoreGauge value={score.overallScore} label="LLM Citation Score" />
          <div className="flex-1 space-y-3">
            {meta.title && (
              <h2 className="text-2xl font-semibold tracking-tight">{meta.title}</h2>
            )}
            {meta.url && (
              <a
                href={meta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-sm text-muted-foreground hover:underline"
              >
                {meta.url}
              </a>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <PageTypeBadge pageType={score.pageType} />
              <IntentBadge intent={score.intent} />
              <span className="inline-flex items-center rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {IMPACT_LABELS[score.estimatedImpact]} if fixed
              </span>
            </div>
            <p className="pt-1 leading-relaxed">{score.summary}</p>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Dimension breakdown</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {DIMENSION_KEYS.map((key) => (
            <DimensionCard key={key} dimensionKey={key} result={score.dimensions[key]} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 py-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Strengths
            </h3>
            <ul className="space-y-2">
              {score.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="shrink-0 text-emerald-600">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 py-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Weaknesses
            </h3>
            <ul className="space-y-2">
              {score.weaknesses.map((w, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="shrink-0 text-red-600">✗</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <PrioritizedFixes fixes={score.fixes} />
    </div>
  )
}
