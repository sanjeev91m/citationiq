import { z } from "zod"
import { DIMENSION_KEYS } from "@/types/score"
import { scoreResultSchema } from "@/types/score"

const rewriteBlockSchema = z.object({
  originalSnippet: z.string().min(10),
  rewrittenSnippet: z.string().min(10),
  targetDimension: z.enum(DIMENSION_KEYS),
  reason: z.string().min(1),
})

export type RewriteBlock = z.infer<typeof rewriteBlockSchema>

export const rewriteResultSchema = z.object({
  rewrites: z.array(rewriteBlockSchema).min(3).max(5),
})

export type RewriteResult = z.infer<typeof rewriteResultSchema>

export const rewriteRequestSchema = z.object({
  content: z.string().min(100, "content must be at least 100 characters"),
  score: scoreResultSchema,
  title: z.string().optional(),
  url: z.string().optional(),
})

export type RewriteRequest = z.infer<typeof rewriteRequestSchema>
