import { Readability } from "@mozilla/readability"
import { JSDOM } from "jsdom"
import type { ExtractedArticle } from "@/types/extract"

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

export function extractFromHtml(html: string, url: string): ExtractedArticle {
  const dom = new JSDOM(html, { url })
  const reader = new Readability(dom.window.document)
  const article = reader.parse()

  if (!article || !article.textContent || article.textContent.trim().length === 0) {
    throw new ExtractError(422, "Could not extract article content from this page")
  }

  const textContent = article.textContent.replace(/\s+/g, " ").trim()

  return {
    url,
    title: article.title ?? "",
    byline: article.byline ?? null,
    siteName: article.siteName ?? null,
    content: article.content ?? "",
    textContent,
    excerpt: article.excerpt ?? "",
    length: textContent.length,
  }
}
