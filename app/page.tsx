"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function HomePage() {
  const [url, setUrl] = useState("")
  const [content, setContent] = useState("")

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
            <Tabs defaultValue="url">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="paste">Paste article</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-4 pt-4">
                <Input
                  type="url"
                  placeholder="https://example.com/your-article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </TabsContent>
              <TabsContent value="paste" className="space-y-4 pt-4">
                <Textarea
                  placeholder="Paste your article text here..."
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </TabsContent>
            </Tabs>
            <Button className="mt-4 w-full" size="lg">
              Analyze
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
