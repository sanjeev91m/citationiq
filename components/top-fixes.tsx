import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"
import { PRIORITY_LABELS, type Fix } from "@/types/score"

export function TopFixes({ fixes }: { fixes: Fix[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fixes</CardTitle>
        <CardDescription>Prioritized actions, ordered by impact.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {fixes.map((fix, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <div className="flex-1 space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">{fix.title}</span>
                  <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {PRIORITY_LABELS[fix.priority]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{fix.description}</p>
              </div>
              <CopyButton text={`${fix.title}\n${fix.description}`} />
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
