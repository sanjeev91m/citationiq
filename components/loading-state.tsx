import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ReportLoadingState({ stage }: { stage: string }) {
  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="flex flex-col items-center gap-8 py-8 md:flex-row md:items-start md:gap-12">
          <Skeleton className="h-[200px] w-[200px] rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </CardContent>
      </Card>

      <div>
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-7 w-10" />
                </div>
                <Skeleton className="h-2 w-full" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">{stage}</p>
    </div>
  )
}
