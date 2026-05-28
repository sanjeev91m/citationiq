import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { scoreClasses } from "@/lib/score-color"
import { DIMENSION_LABELS, type DimensionKey, type DimensionResult } from "@/types/score"

export function DimensionCard({
  dimensionKey,
  result,
}: {
  dimensionKey: DimensionKey
  result: DimensionResult
}) {
  const classes = scoreClasses(result.score)
  return (
    <Card>
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <CardTitle className="text-base">{DIMENSION_LABELS[dimensionKey]}</CardTitle>
          <span className={`text-2xl font-semibold ${classes.text}`}>{result.score}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full transition-all ${classes.progress}`}
            style={{ width: `${result.score}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="text-sm">
        <p className="text-muted-foreground">{result.reasoning}</p>
      </CardContent>
    </Card>
  )
}
