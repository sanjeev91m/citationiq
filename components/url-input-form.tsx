"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Mode = "url" | "html"

export function UrlInputForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("url")
  const [url, setUrl] = useState("")
  const [html, setHtml] = useState("")
  const [error, setError] = useState("")

  function submit() {
    setError("")
    let payload: { mode: "url"; url: string } | { mode: "html"; html: string }

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
      if (html.trim().length < 50) {
        setError("Paste at least 50 characters of HTML.")
        return
      }
      payload = { mode, html: html.trim() }
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
          <TabsTrigger value="html">Paste Code</TabsTrigger>
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
        <TabsContent value="html" className="space-y-2 pt-4">
          <Textarea
            placeholder="Paste the page's HTML source here, e.g. <article><h1>…</h1><h2>…</h2><p>…</p>…</article>"
            rows={10}
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Paste raw HTML (view-source or copy of the article element). Same Readability +
            markdown pipeline as URL mode runs over it, so the audit reads your real H1 / H2 /
            H3 hierarchy, lists, and tables.
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
