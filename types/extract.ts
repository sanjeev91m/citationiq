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

export const extractRequestSchema = z.union([
  z.object({ url: httpUrl }),
  z.object({ html: z.string().min(50, "HTML must be at least 50 characters") }),
])
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
