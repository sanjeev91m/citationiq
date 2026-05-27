import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
}: {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div className="space-y-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="max-w-md text-sm text-muted-foreground">{message}</p>
        </div>
        {onRetry && <Button onClick={onRetry}>{retryLabel}</Button>}
      </CardContent>
    </Card>
  )
}
