import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { DIMENSION_LABELS } from "@/types/score"
import type { RewriteBlock } from "@/types/rewrite"

export function RewriteBlockCard({ rewrite }: { rewrite: RewriteBlock }) {
  return (
    <Card>
      <CardHeader className="space-y-2 pb-3">
        <div>
          <span className="inline-flex items-center rounded-full border bg-muted px-2.5 py-0.5 text-xs font-medium">
            {DIMENSION_LABELS[rewrite.targetDimension]}
          </span>
        </div>
        <CardDescription>{rewrite.reason}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Original
          </div>
          <div className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm leading-relaxed">
            {rewrite.originalSnippet}
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-emerald-700">
            Rewritten
          </div>
          <div className="whitespace-pre-wrap rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm leading-relaxed">
            {rewrite.rewrittenSnippet}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
