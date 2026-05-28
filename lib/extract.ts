import { Readability } from "@mozilla/readability"
import { JSDOM } from "jsdom"
import TurndownService from "turndown"
import type { ExtractedArticle } from "@/types/extract"

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
})
turndown.remove(["script", "style", "noscript"])

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

function cleanedHtmlAndText(el: Element): { html: string; text: string } {
  const clone = el.cloneNode(true) as Element
  clone.querySelectorAll("script, style, noscript").forEach((n) => n.remove())
  return {
    html: clone.outerHTML,
    text: (clone.textContent ?? "").replace(/\s+/g, " ").trim(),
  }
}

function selectFallback(doc: Document): { html: string; text: string } {
  const mainEl = doc.querySelector("main")
  const articleEls = Array.from(doc.querySelectorAll("article"))

  // Listicle / index page with multiple <article> children inside a <main> wrapper:
  // use <main> to capture every item (one <article> alone would miss the rest).
  if (mainEl && articleEls.length > 1) return cleanedHtmlAndText(mainEl)

  // Multiple <article>s but no <main> wrapper: concatenate them.
  if (articleEls.length > 1) {
    const wrap = doc.createElement("div")
    articleEls.forEach((a) => wrap.appendChild(a.cloneNode(true)))
    return cleanedHtmlAndText(wrap)
  }

  // Single <article>: standard article page (e.g. cashkr.com).
  if (articleEls.length === 1) return cleanedHtmlAndText(articleEls[0])

  // Only <main> exists: use it.
  if (mainEl) return cleanedHtmlAndText(mainEl)

  return { html: "", text: "" }
}

export function extractFromHtml(html: string, url: string): ExtractedArticle {
  const dom = new JSDOM(html, url ? { url } : undefined)
  const doc = dom.window.document

  // Capture the semantic-tag fallback BEFORE running Readability, which mutates
  // the DOM. Readability misidentifies main content on some pages — listicles
  // (91mobiles) collapse to the intro paragraph; some sites pick the footer.
  // Preferring an explicit <main>/<article> structure rescues both cases.
  const { html: fallbackHtml, text: fallbackText } = selectFallback(doc)

  const reader = new Readability(doc)
  const article = reader.parse()
  const readabilityText = (article?.textContent ?? "").replace(/\s+/g, " ").trim()
  const readabilityHtml = article?.content ?? ""

  const useFallback =
    fallbackText.length > 500 && fallbackText.length > readabilityText.length * 3

  const bodyHtml = useFallback ? fallbackHtml : readabilityHtml
  const bodyText = useFallback ? fallbackText : readabilityText

  if (bodyText.length === 0) {
    throw new ExtractError(422, "Could not extract article content from this page")
  }

  const markdown = bodyHtml ? turndown.turndown(bodyHtml).trim() : bodyText

  return {
    url,
    title: article?.title ?? "",
    byline: article?.byline ?? null,
    siteName: article?.siteName ?? null,
    content: bodyHtml,
    textContent: bodyText,
    markdown,
    excerpt: article?.excerpt ?? "",
    length: bodyText.length,
  }
}
