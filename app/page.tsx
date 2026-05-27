import { Sparkles } from "lucide-react"
import { UrlInputForm } from "@/components/url-input-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-3xl py-16">
        <header className="mb-12 space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            AI Citation Score Analyzer
          </div>
          <h1 className="text-5xl font-semibold tracking-tight">CitationIQ</h1>
          <p className="text-xl text-muted-foreground">
            Check whether your content can be cited by AI engines.
          </p>
          <p className="text-sm text-muted-foreground">
            Analyze your article for ChatGPT, Claude, Gemini, and Perplexity visibility.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Analyze content</CardTitle>
            <CardDescription>
              Paste a URL or article text to get an AI citation score.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UrlInputForm />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
