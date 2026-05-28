import { Readability } from "@mozilla/readability"
import { JSDOM } from "jsdom"
import TurndownService from "turndown"
// @ts-expect-error — turndown-plugin-gfm ships without its own types
import * as turndownGfm from "turndown-plugin-gfm"
import type { ExtractedArticle } from "@/types/extract"

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
})
const tablesPlugin = turndownGfm.tables ?? turndownGfm.default?.tables
const strikethroughPlugin = turndownGfm.strikethrough ?? turndownGfm.default?.strikethrough
const taskListPlugin = turndownGfm.taskListItems ?? turndownGfm.default?.taskListItems
if (tablesPlugin) turndown.use(tablesPlugin)
if (strikethroughPlugin) turndown.use(strikethroughPlugin)
if (taskListPlugin) turndown.use(taskListPlugin)
turndown.remove(["script", "style", "noscript"])

// <dl><dt><dd> definition lists: render as a markdown list with bold terms
turndown.addRule("definitionList", {
  filter: ["dl"],
  replacement: (_content, node) => {
    const el = node as Element
    const items: string[] = []
    let currentTerm = ""
    Array.from(el.children).forEach((child) => {
      const tag = child.tagName.toLowerCase()
      const text = (child.textContent ?? "").trim()
      if (!text) return
      if (tag === "dt") currentTerm = text
      else if (tag === "dd") items.push(`- **${currentTerm}** — ${text}`)
    })
    return items.length > 0 ? `\n\n${items.join("\n")}\n\n` : ""
  },
})

// <figure><figcaption>: keep the caption as a quoted line under any image
turndown.addRule("figure", {
  filter: ["figure"],
  replacement: (content) => `\n\n${content.trim()}\n\n`,
})

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
const FETCH_TIMEOUT_MS = 15_000

export class ExtractError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = "ExtractError"
  }
}

export async function extractFromUrl(url: string): Promise<ExtractedArticle> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
      redirect: "follow",
    })
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof Error && err.name === "AbortError") {
      throw new ExtractError(422, "Request timed out fetching the URL")
    }
    throw new ExtractError(422, "Could not fetch the URL")
  }
  clearTimeout(timer)

  if (!response.ok) {
    throw new ExtractError(422, `Page returned HTTP ${response.status}`)
  }

  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.toLowerCase().includes("html")) {
    throw new ExtractError(
      422,
      `Unsupported content type: ${contentType || "unknown"}. Only HTML pages can be analyzed.`
    )
  }

  const html = await response.text()
  return extractFromHtml(html, url)
}

type PageMeta = {
  author?: string
  published?: string
  modified?: string
  description?: string
}

function extractMeta(doc: Document): PageMeta {
  const get = (sel: string) => doc.querySelector(sel)?.getAttribute("content")?.trim() || undefined
  return {
    author: get('meta[name="author"]') ?? get('meta[property="article:author"]'),
    published: get('meta[property="article:published_time"]'),
    modified: get('meta[property="article:modified_time"]'),
    description: get('meta[name="description"]') ?? get('meta[property="og:description"]'),
  }
}

function extractJsonLd(doc: Document): unknown[] {
  const blobs: unknown[] = []
  doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try {
      const parsed = JSON.parse(s.textContent ?? "")
      if (parsed !== null && parsed !== undefined) blobs.push(parsed)
    } catch {
      // ignore malformed JSON-LD
    }
  })
  return blobs
}

function buildPrefix(meta: PageMeta, jsonLd: unknown[]): string {
  const lines: string[] = []

  const metaItems: string[] = []
  if (meta.description) metaItems.push(`- Description: ${meta.description}`)
  if (meta.author) metaItems.push(`- Author: ${meta.author}`)
  if (meta.published) metaItems.push(`- Published: ${meta.published}`)
  if (meta.modified) metaItems.push(`- Last updated: ${meta.modified}`)

  if (metaItems.length > 0) {
    lines.push("## Page metadata", ...metaItems, "")
  }

  if (jsonLd.length > 0) {
    const dump = JSON.stringify(jsonLd.length === 1 ? jsonLd[0] : jsonLd, null, 2)
    lines.push("## Structured data (JSON-LD)", "```json", dump, "```", "")
  }

  return lines.length > 0 ? lines.join("\n") + "\n" : ""
}

function prepareDocument(doc: Document) {
  // Strip non-content elements globally (we've already captured JSON-LD).
  doc.querySelectorAll("script, style, noscript").forEach((n) => n.remove())

  // Flatten <details>/<summary>: collapsible content is still in the source HTML,
  // so the audit should see it. We unwrap the <details> so children become inline.
  doc.querySelectorAll("details").forEach((d) => {
    const parent = d.parentNode
    if (!parent) return
    while (d.firstChild) parent.insertBefore(d.firstChild, d)
    d.remove()
  })

  // Common nav/aside/footer noise that often sits inside <main> on poorly-marked
  // sites: drop generic site-wide chrome by role/aria/class hints so it doesn't
  // dilute the audit. We're conservative — only drop elements with explicit role.
  doc
    .querySelectorAll(
      '[role="banner"], [role="navigation"], [role="contentinfo"], [aria-hidden="true"]'
    )
    .forEach((n) => n.remove())
}

function elementHtmlAndText(el: Element): { html: string; text: string } {
  return {
    html: el.outerHTML,
    text: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
  }
}

function selectFallback(doc: Document): { html: string; text: string } {
  const mainEl = doc.querySelector("main")
  const articleEls = Array.from(doc.querySelectorAll("article"))

  // Listicle / index page with multiple <article> children inside a <main> wrapper:
  // use <main> to capture every item (one <article> alone would miss the rest).
  if (mainEl && articleEls.length > 1) return elementHtmlAndText(mainEl)

  // Multiple <article>s but no <main> wrapper: concatenate them.
  if (articleEls.length > 1) {
    const wrap = doc.createElement("div")
    articleEls.forEach((a) => wrap.appendChild(a.cloneNode(true)))
    return elementHtmlAndText(wrap)
  }

  // Single <article>: standard article page (e.g. cashkr.com).
  if (articleEls.length === 1) return elementHtmlAndText(articleEls[0])

  // Only <main> exists: use it.
  if (mainEl) return elementHtmlAndText(mainEl)

  return { html: "", text: "" }
}

export function extractFromHtml(html: string, url: string): ExtractedArticle {
  const dom = new JSDOM(html, url ? { url } : undefined)
  const doc = dom.window.document

  // 1. Pull structured/meta data BEFORE any DOM mutation strips it.
  const meta = extractMeta(doc)
  const jsonLd = extractJsonLd(doc)

  // 2. Globally clean the document: strip scripts/styles, flatten <details>,
  //    remove explicitly nav/footer-flagged regions.
  prepareDocument(doc)

  // 3. Capture the semantic-tag fallback BEFORE Readability mutates the DOM.
  const { html: fallbackHtml, text: fallbackText } = selectFallback(doc)

  // 4. Run Readability and decide which body source wins.
  const reader = new Readability(doc)
  const article = reader.parse()
  const readabilityText = (article?.textContent ?? "").replace(/\s+/g, " ").trim()
  const readabilityHtml = article?.content ?? ""

  const useFallback =
    fallbackText.length > 500 && fallbackText.length > readabilityText.length * 3

  const bodyHtml = useFallback ? fallbackHtml : readabilityHtml
  const bodyText = useFallback ? fallbackText : readabilityText

  if (bodyText.length === 0 && jsonLd.length === 0 && !meta.description) {
    throw new ExtractError(422, "Could not extract article content from this page")
  }

  const bodyMarkdown = bodyHtml ? turndown.turndown(bodyHtml).trim() : bodyText
  const prefix = buildPrefix(meta, jsonLd)
  const markdown = (prefix + bodyMarkdown).trim()

  return {
    url,
    title: article?.title ?? "",
    byline: article?.byline ?? meta.author ?? null,
    siteName: article?.siteName ?? null,
    content: bodyHtml,
    textContent: bodyText,
    markdown,
    excerpt: article?.excerpt ?? meta.description ?? "",
    length: bodyText.length,
  }
}
