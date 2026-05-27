import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function EntityPills({ entities }: { entities: string[] }) {
  if (entities.length === 0) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detected entities</CardTitle>
        <CardDescription>What the AI sees as the article&apos;s central concepts.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {entities.map((entity) => (
          <span
            key={entity}
            className="rounded-full bg-secondary px-3 py-1 text-xs font-medium"
          >
            {entity}
          </span>
        ))}
      </CardContent>
    </Card>
  )
}
