import { z } from "zod"

const httpUrl = z.string().refine(
  (val) => {
    try {
      const u = new URL(val)
      return u.protocol === "http:" || u.protocol === "https:"
    } catch {
      return false
    }
  },
  { message: "Must be a valid http(s) URL" }
)

export const extractRequestSchema = z.object({
  url: httpUrl,
})
export type ExtractRequest = z.infer<typeof extractRequestSchema>

export const extractedArticleSchema = z.object({
  url: z.string(),
  title: z.string(),
  byline: z.string().nullable(),
  siteName: z.string().nullable(),
  content: z.string(),
  textContent: z.string(),
  markdown: z.string(),
  excerpt: z.string(),
  length: z.number(),
})
export type ExtractedArticle = z.infer<typeof extractedArticleSchema>
