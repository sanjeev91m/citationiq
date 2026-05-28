import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"
import { priorityClasses } from "@/lib/score-color"
import { PRIORITY_LABELS, type Fix, type Priority } from "@/types/score"

function PriorityBadge({ priority }: { priority: Priority }) {
  const classes = priorityClasses(priority)
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${classes.text} ${classes.bg} ${classes.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${classes.dot}`} />
      {PRIORITY_LABELS[priority]}
    </span>
  )
}

export function PrioritizedFixes({ fixes }: { fixes: Fix[] }) {
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
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{fix.title}</span>
                  <PriorityBadge priority={fix.priority} />
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
