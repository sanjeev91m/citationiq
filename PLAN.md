# CitationIQ — Build Plan

A 1-day MVP that takes a URL (or pasted article), scores it on 7 dimensions of AI-citation-readiness, surfaces fixes, and offers rewritten passages.

End-to-end goal: `URL → extracted text → Claude scoring → report UI with score, dimensions, fixes, rewrites`.

---

## Phase 1 — Scaffold

Get a styled Next.js 14 app running with the URL-input landing page shell.

**Files to create**
- `package.json`, `pnpm-lock.yaml` (or `package-lock.json`)
- `tsconfig.json`
- `next.config.mjs`
- `tailwind.config.ts`, `postcss.config.mjs`, `app/globals.css`
- `components.json` (shadcn config)
- `lib/utils.ts` (shadcn `cn` helper)
- `app/layout.tsx` — root layout, metadata (title: "CitationIQ")
- `app/page.tsx` — landing page with URL/paste input + Analyze button (non-functional)
- `components/ui/*` — shadcn primitives: `button`, `card`, `input`, `tabs`, `progress`, `textarea`, `skeleton`
- `.env.local.example` — `ANTHROPIC_API_KEY=`
- `.gitignore`
- `README.md` (minimal)

**Libraries**
- `next@14`, `react@18`, `react-dom@18`
- `typescript`, `@types/node`, `@types/react`, `@types/react-dom`
- `tailwindcss`, `postcss`, `autoprefixer`
- `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` (shadcn deps)
- `@radix-ui/react-tabs`, `@radix-ui/react-progress`, `@radix-ui/react-slot`

**Acceptance criteria**
- `pnpm dev` (or `npm run dev`) serves a landing page at `localhost:3000`
- Page has the brand name "CitationIQ", a Tabs control (URL / Paste), an input/textarea, an Analyze button
- `tsc --noEmit` and `next build` both pass
- `git init` done, Phase 1 committed

---

## Phase 2 — URL fetcher + content parser

Server-side extraction of clean article text from a URL.

**Files to create**
- `lib/extract.ts` — `extractFromUrl(url)` and `extractFromHtml(html, url)`; returns `{ title, byline, content, textContent, length, excerpt, siteName }`
- `app/api/extract/route.ts` — `POST /api/extract` accepting `{ url }`, validates with zod, calls `extractFromUrl`
- `types/extract.ts` — shared zod schema + inferred TS type for extracted article

**Libraries**
- `@mozilla/readability`
- `jsdom`
- `zod`

**Acceptance criteria**
- `POST /api/extract { url: "https://..." }` returns the extracted article JSON (200) for a real public article
- Invalid URL → 400 with a clear error message
- Non-HTML response (PDF, 404, paywall) → 422 with a clear error message
- Extracted `textContent` is the article body only (no nav/footer/ads), and `length > 500` for typical articles
- User-Agent header set to a real-looking value so most sites return content
- Phase 2 committed

---

## Phase 3 — LLM scoring engine

Run Claude against the 7-dimension framework and return structured JSON.

**Files to create**
- `lib/scoring-prompt.ts` — **LOCKED.** The system prompt and JSON schema instructions. See CLAUDE.md hard rule.
- `lib/scoring.ts` — `scoreArticle({ title, content, url })` → typed result
- `lib/anthropic.ts` — shared Anthropic client (reads `ANTHROPIC_API_KEY` from env)
- `app/api/analyze/route.ts` — `POST /api/analyze` accepting `{ content, title?, url? }`
- `types/score.ts` — zod schema for the scoring result

**The 7 dimensions (canonical)**
1. Entity Coverage
2. Definition Clarity
3. Structured Formatting
4. AI Readability
5. Topical Completeness
6. Trust Signals
7. FAQ Coverage

**Result shape**
```ts
{
  overallScore: number,            // 0–100, weighted average of dimensions
  dimensions: {
    [key in DimensionKey]: {
      score: number,               // 0–100
      reasoning: string,           // 1–2 sentences
      fixes: string[]              // 1–3 concrete actions
    }
  },
  detectedEntities: string[],      // 5–15 named entities/concepts
  topFixes: string[],              // 3–5 highest-leverage fixes overall
  summary: string                  // 2–3 sentence verdict
}
```

**Libraries**
- `@anthropic-ai/sdk`
- `zod` (for validating Claude's JSON output)

**Acceptance criteria**
- Model: `claude-opus-4-5`, `temperature: 0`, `max_tokens: 4000`
- `POST /api/analyze` with a real article returns valid JSON matching the schema
- Re-running on the same article yields scores within ±5 points (deterministic enough)
- Malformed LLM output → caught by zod, returned as a 502 with a clear error
- Long articles (> 30k chars) are truncated server-side with a marker before sending
- Phase 3 committed

---

## Phase 4 — Suggested rewrite blocks

A second LLM call that proposes rewrites of the article's weakest existing passages.

**Files to create**
- `lib/rewrite-prompt.ts` — prompt that takes the score report + article and asks for 3–5 rewrites of weak passages
- `lib/rewrite.ts` — `generateRewrites({ content, score })` → typed result
- `app/api/rewrite/route.ts` — `POST /api/rewrite` accepting `{ content, score }`
- `types/rewrite.ts` — zod schema

**Result shape**
```ts
{
  rewrites: Array<{
    originalSnippet: string,       // verbatim from article (or close paraphrase if too long)
    rewrittenSnippet: string,      // AI-citation-friendlier version
    targetDimension: DimensionKey, // which weak dimension this fixes
    reason: string                 // 1 sentence why this rewrite helps
  }>
}
```

**Libraries**
- Reuses `@anthropic-ai/sdk` from Phase 3

**Acceptance criteria**
- Model: `claude-sonnet-4-5`, `temperature: 0.3`
- Returns 3–5 rewrites, each targeting one of the lowest-scoring dimensions
- `originalSnippet` is recognizable in the source article
- Schema-validated; malformed output returns 502 with clear error
- Phase 4 committed

---

## Phase 5 — Report UI

Render the full analysis as a polished, demo-ready report.

**Files to create**
- `app/analyze/page.tsx` — report page; reads URL/content from query params or client state
- `components/url-input-form.tsx` — Tabs (URL / Paste) + Analyze, with client-side validation
- `components/score-gauge.tsx` — circular SVG gauge for the overall score, color-coded
- `components/dimension-card.tsx` — one card per dimension: score, progress bar, reasoning, fixes
- `components/entity-pills.tsx` — chips for `detectedEntities`
- `components/top-fixes.tsx` — prioritized action list
- `components/rewrite-block.tsx` — side-by-side original vs rewritten, with target dimension badge
- `components/report.tsx` — composes the above into the full report layout
- `lib/score-color.ts` — score → color (red < 60, yellow 60–79, green 80+)
- `app/page.tsx` — wire the form to navigate to `/analyze` with the input

**Libraries**
- All existing; no new deps

**Acceptance criteria**
- End-to-end: paste a real article URL on `/` → land on `/analyze` → see full report
- Score gauge animates in; dimension cards expand to show fixes
- Rewrite blocks render side-by-side and are readable on mobile
- All sections render correctly with sample data even if rewrites haven't finished yet (rewrites can stream in after scoring)
- Phase 5 committed

---

## Phase 6 — Polish

Loading states, error handling, copy-to-clipboard, localStorage history.

**Files to create**
- `components/loading-state.tsx` — skeleton placeholders for gauge + dimension cards while scoring runs
- `components/error-state.tsx` — friendly error UI for fetch failures, extraction failures, LLM failures
- `components/history-sidebar.tsx` — recent analyses (last 10) in a sidebar/dropdown
- `lib/history.ts` — localStorage CRUD: `saveReport`, `getRecent`, `getById`, `clearHistory`
- `hooks/use-copy-to-clipboard.ts` — copy + brief "Copied!" toast feedback
- `types/history.ts` — `StoredReport` schema

**History scope (decision)**
- Store full reports keyed by content hash (sha-1 of normalized text) + URL
- Re-opening a history item loads the cached report instantly without re-running analysis
- Cap at 10 most recent; oldest evicted

**Libraries**
- No new deps; use Web Crypto for hashing

**Acceptance criteria**
- Slow network → user sees skeleton, not a blank page
- 4xx/5xx from any API → friendly error card with a "Try again" button (not raw stack traces)
- Copy buttons on every fix and rewrite block; visual confirmation on copy
- Last 10 analyses persist across reloads; clicking one reopens the report instantly
- Phase 6 committed; MVP shippable
