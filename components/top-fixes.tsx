import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"

export function TopFixes({ fixes }: { fixes: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top fixes</CardTitle>
        <CardDescription>The highest-leverage actions, in order of impact.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {fixes.map((fix, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <span className="flex-1 pt-0.5 text-sm">{fix}</span>
              <CopyButton text={fix} />
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
