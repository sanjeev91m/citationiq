import { Card, CardContent } from "@/components/ui/card"
import { DimensionCard } from "@/components/dimension-card"
import { EntityPills } from "@/components/entity-pills"
import { RewriteBlockCard } from "@/components/rewrite-block"
import { ScoreGauge } from "@/components/score-gauge"
import { TopFixes } from "@/components/top-fixes"
import { DIMENSION_KEYS, type ScoreResult } from "@/types/score"
import type { RewriteBlock } from "@/types/rewrite"

export function Report({
  score,
  rewrites,
  rewritesLoading,
  meta,
}: {
  score: ScoreResult
  rewrites: RewriteBlock[] | null
  rewritesLoading: boolean
  meta: { title?: string; url?: string }
}) {
  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="flex flex-col items-center gap-8 py-8 md:flex-row md:items-start md:gap-12">
          <ScoreGauge value={score.overallScore} label="AI Citation Score" />
          <div className="flex-1 space-y-3">
            {meta.title && <h2 className="text-2xl font-semibold tracking-tight">{meta.title}</h2>}
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
            <p className="leading-relaxed">{score.summary}</p>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Dimension breakdown</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {DIMENSION_KEYS.map((key) => (
            <DimensionCard key={key} dimensionKey={key} result={score.dimensions[key]} />
          ))}
        </div>
      </section>

      <TopFixes fixes={score.topFixes} />

      <EntityPills entities={score.detectedEntities} />

      <section>
        <h2 className="mb-4 text-lg font-semibold">Suggested rewrites</h2>
        {rewrites === null ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {rewritesLoading
                ? "Generating rewrites…"
                : "Rewrites are not available for this analysis."}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rewrites.map((rewrite, i) => (
              <RewriteBlockCard key={i} rewrite={rewrite} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
