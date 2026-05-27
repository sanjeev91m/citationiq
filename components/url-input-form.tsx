"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Mode = "url" | "paste"

export function UrlInputForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("url")
  const [url, setUrl] = useState("")
  const [content, setContent] = useState("")
  const [error, setError] = useState("")

  function submit() {
    setError("")
    let payload: { mode: Mode; url?: string; content?: string }

    if (mode === "url") {
      if (!url.trim()) {
        setError("Enter a URL.")
        return
      }
      try {
        const parsed = new URL(url.trim())
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          setError("URL must use http or https.")
          return
        }
      } catch {
        setError("Enter a valid URL.")
        return
      }
      payload = { mode, url: url.trim() }
    } else {
      if (content.trim().length < 100) {
        setError("Paste at least 100 characters.")
        return
      }
      payload = { mode, content: content.trim() }
    }

    const sessionId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
    sessionStorage.setItem(`citationiq:${sessionId}`, JSON.stringify(payload))
    router.push(`/analyze?session=${sessionId}`)
  }

  return (
    <div>
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">URL</TabsTrigger>
          <TabsTrigger value="paste">Paste article</TabsTrigger>
        </TabsList>
        <TabsContent value="url" className="pt-4">
          <Input
            type="url"
            placeholder="https://example.com/your-article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit()
            }}
          />
        </TabsContent>
        <TabsContent value="paste" className="space-y-2 pt-4">
          <Textarea
            placeholder="Paste your article text here…"
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Supports markdown. Use <code className="rounded bg-muted px-1">#</code> for H1,{" "}
            <code className="rounded bg-muted px-1">##</code> for H2, lists, and tables so the
            Structured Formatting score reflects your real hierarchy.
          </p>
        </TabsContent>
      </Tabs>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <Button className="mt-4 w-full" size="lg" onClick={submit}>
        Analyze
      </Button>
    </div>
  )
}
