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

---

# Migration: Single-Call → Page-Type-Aware Auditor

Upgrades the scoring engine from a flat 7-dimension citation-readiness scorer to a page-type-aware multi-stage auditor in a single LLM call. Spec source: "LLM Citation Optimization Guidelines by Page Type" (provided 2026-05-28).

## What changes vs. the current MVP

| Concept | Now | After migration |
|---|---|---|
| Dimensions | 7 | **9** (Structure, Extractability, Direct Answers, Trust Signals, Tables/Structured Data, Recommendation Clarity, Entity Clarity, Freshness, FAQ/Supporting Answers) |
| Detection | none | **Page type** (13 categories) + **Intent** (9 categories) |
| Fix model | flat `topFixes[]` array | **Prioritized fixes** with `Critical / High / Medium / Low` badges |
| Output shape | `{ overall, dimensions, detectedEntities, topFixes, summary }` | `{ overall, pageType, intent, dimensions, strengths, weaknesses, fixes, estimatedImpact, summary }` |
| Rewrites flow | side-by-side rewrites of weak passages | **Open question — see Decisions §1** |
| Model | `claude-opus-4-5` | `claude-opus-4-7` |
| LLM calls | 1 (scoring) + 1 (rewrites) | 1 (audit + scoring + fixes) |
| Locked file | `lib/scoring-prompt.ts` IP | Same file, full rewrite proposed & approved this turn |

## Architecture (locked-in by user)

- **One LLM call** — detection + audit + scoring + fixes in a single structured tool_use output.
- **`lib/scoring-prompt.ts` stays sacred** — Migration Phase 1 stages a proposed replacement at `lib/scoring-prompt.proposed.ts` and waits for explicit approval before the atomic rename.
- **Opus 4.7 only.** Pipeline split (Haiku for detection + Opus for audit) is out of scope; revisit later.

## Decisions needed before code (please confirm)

1. **Rewrites flow** — new spec doesn't mention rewrite blocks. Three options:
   - **(a) Drop entirely.** Delete `lib/rewrite*`, `app/api/rewrite/`, `components/rewrite-block.tsx`, `types/rewrite.ts`. Cleanest.
   - **(b) Keep with new dimension keys.** Rewrite targets one of the 9 new dimensions instead of one of the 7 old ones. Pure mechanical update.
   - **(c) Replace with "Suggested Blocks"** (from the earlier mockup) — Quick Verdict, FAQ Example, Evidence Example, etc. New scope.

2. **Detected entities** — spec doesn't mention. Drop or keep as a sidebar pill section?

3. **Page-type coverage** — Step 1 of the spec lists 13 page types; Step 4 only gives detailed guidance for 9. Two options:
   - **(a) Detect all 13.** The 4 without detailed guidance (Timeline/History, Deal/Offer, Category/Catalog, Tool/Utility) fall back to global readiness checks. More accurate detection.
   - **(b) Restrict to 9.** Cleaner; risk of forcing a Deal page into "Best Listicle" and getting nonsense suggestions.

4. **Priority levels** — show all four (Critical/High/Medium/Low) or filter to High+ in the UI? I lean show all four with color tiers; spec defines all four.

5. **Scoring weights** — spec gives one flat weight table for all page types. Apply flat weights, or vary by page type (e.g., FAQ weight higher on Fact/FAQ pages)? I lean flat — matches spec literally.

6. **Strengths / Weaknesses sourcing** — spec shows them as free-text bullet lists separate from fixes. Generate them as independent free-text fields, or auto-derive (top-3 high-scoring dimensions = strengths, top-3 low-scoring = weaknesses)? I lean independent free-text — more flexibility for the LLM to highlight cross-cutting wins/issues.

7. **Cached history compatibility** — old `StoredReport` items in localStorage have the old shape. On schema change:
   - **(a) Drop them silently** (cleanest; users lose old history)
   - **(b) Version the shape**, show "Legacy v1" badge, render with old layout
   - **(c) Show a "Re-run to upgrade" prompt** instead of rendering
   I lean (a) — MVP, history is shallow.

---

## Migration Phase 1 — Rewrite `scoring-prompt.ts`

The core change. Replaces the 7-dimension flat scorer with a page-type-aware auditor.

**Files touched**
- `lib/scoring-prompt.proposed.ts` (new — staged for user review)
- After approval: rename → `lib/scoring-prompt.ts` (atomic swap, single commit)
- `lib/anthropic.ts` — bump `SCORING_MODEL` to `claude-opus-4-7`
- `CLAUDE.md` — update the model line + bump the timestamp of the lock on the new prompt

**Prompt structure (what goes into the new file)**
- System prompt sections in order:
  1. Role: "AI Citation Optimization Analyst"
  2. Step 1: page type detection rules (13 categories) — short canonical defs
  3. Step 2: intent detection rules (9 categories)
  4. Step 3: global readiness checks (Structure / Extractability / Trust / Entity Clarity)
  5. Step 4: page-type-specific guidance — 9 detailed must-have/missing-signal/suggestion blocks (per spec §1-9)
  6. Step 5: 9-dimension scoring rubric with weights and calibration scale
  7. Step 6: output format (via tool_use, single submit_audit tool)
  8. Step 7: priority engine (Critical/High/Medium/Low definitions)
  9. Step 8: final rules (always / avoid)
- New tool name: `submit_audit` (was `submit_score`)
- New tool input schema with required fields: overallScore, pageType, intent, dimensions (9 keys), strengths, weaknesses, fixes (array of `{title, description, priority}`), estimatedImpact, summary

**Breaking changes during this phase**
- Until Migration Phase 2 lands, the proposed prompt is unused — no runtime impact.
- After the atomic rename + model bump, `/api/analyze` will return the new shape and break `lib/scoring.ts` zod validation (old schema rejects new output). Phase 2 must follow immediately.

**Done when**
- `lib/scoring-prompt.proposed.ts` written
- User has read it and explicitly approved
- File renamed to `lib/scoring-prompt.ts` (single atomic commit also bumps model + updates CLAUDE.md)

---

## Migration Phase 2 — Update Response Schema and TypeScript Types

Aligns the runtime code to the new prompt's output shape so `tsc` and `next build` are clean again.

**Files touched**
- `types/score.ts` — full rewrite:
  - New `DIMENSION_KEYS` (9): `structure`, `extractability`, `directAnswers`, `trustSignals`, `tablesStructuredData`, `recommendationClarity`, `entityClarity`, `freshness`, `faqSupportingAnswers`
  - New `DIMENSION_WEIGHTS` table (per spec)
  - New `PAGE_TYPES` const + `PAGE_TYPE_LABELS`
  - New `INTENTS` const + `INTENT_LABELS`
  - New `PRIORITY_LEVELS` const: `["critical","high","medium","low"]`
  - New `scoreResultSchema` shape (matches the prompt's tool input schema)
  - Drops `detectedEntities` and `topFixes` (replaced by `strengths`, `weaknesses`, prioritized `fixes`)
- `lib/scoring.ts` — same skeleton, new return type. Tool name updated to `submit_audit`.
- `app/api/analyze/route.ts` — same skeleton, validates new shape.
- `types/rewrite.ts`, `lib/rewrite*.ts`, `app/api/rewrite/route.ts` — handled per **Decision §1** (drop / keep with new keys / replace with suggested blocks)
- `types/history.ts` — `StoredReport.score` becomes the new `ScoreResult` shape
- `lib/history.ts` — on first read, drop any cached items with the old shape (per **Decision §7a**)

**Breaking changes**
- Build is broken between starting Phase 2 and finishing it — any code referencing the old `DIMENSION_KEYS` won't compile.
- All cached history reports become invalid and are dropped on next page load.
- `/api/rewrite` either disappears (decision (a)) or still works but with new dimension keys (decision (b)).

**Done when**
- `tsc --noEmit` clean
- `next build` clean
- Live `/api/analyze` call against a Wikipedia URL returns the new shape and passes zod validation
- Browser flow still functions end-to-end (UI may temporarily render wrong labels, fixed in Phase 3)

---

## Migration Phase 3 — Update Report UI

Re-skins the report to surface page type + intent, the 9 dimensions, prioritized fixes, and strengths/weaknesses.

**Files touched**
- `components/report.tsx` — major rework. New layout:
  - Header card: gauge + summary + **Page Type badge + Intent badge** + (optional) estimated impact pill
  - Dimension breakdown: 9 cards in a 3×3 or 2-col grid (was 7 cards 2-col)
  - **Strengths** section (replaces or accompanies `EntityPills`)
  - **Weaknesses** section
  - **Prioritized Fixes** section with Critical / High / Medium / Low badges (replaces `TopFixes`)
  - (Decision §1 dependent) Suggested Blocks / Rewrite Blocks / removed
- `components/dimension-card.tsx` — works as-is; just gets new labels from updated `DIMENSION_LABELS`
- `components/top-fixes.tsx` → rename to `components/prioritized-fixes.tsx`, add priority badge column
- `components/entity-pills.tsx` → either repurpose as `strengths-list.tsx` + new `weaknesses-list.tsx`, or delete (Decision §2)
- `components/page-type-badge.tsx` — new; small pill with icon + label
- `components/intent-badge.tsx` — new; small pill with icon + label
- `lib/score-color.ts` — add `priorityClasses(priority)` helper (red/orange/amber/slate for critical/high/medium/low)
- `app/analyze/page.tsx` — update the `fetch` types and the result handling; logic largely unchanged
- `components/loading-state.tsx` — update skeleton row count (7 → 9 cards)
- `components/history-sidebar.tsx` — show page type as a small label under the title

**Breaking changes**
- Any in-flight or cached old-shape reports won't render (we dropped them in Phase 2)
- Visual regression possible if Tailwind misses any new classes — restart dev cleanly when verifying

**Done when**
- End-to-end browser flow renders a real Wikipedia URL with:
  - Visible Page Type and Intent badges in the header
  - 9 dimension cards (correct labels, calibrated scores)
  - Strengths + Weaknesses sections populated
  - Fixes list with visible priority badges (color-tiered)
- `tsc` + `next build` clean
- Live spot-check on at least one URL per page-type category I can hit fast

---

## Migration Phase 4 — Test Plan with 10 Sample URLs

Validate page-type detection, intent detection, score sanity, and per-fix priority across the page-type catalog. Documentation phase, not implementation.

**Files touched**
- `TESTS.md` (new) — table of URLs, expected page type, expected intent, observed values, dimension highlights, notes

**Sample URLs (one per detailed page type, plus 1 stress test)**

| # | URL | Expected Page Type | Expected Intent |
|---|---|---|---|
| 1 | en.wikipedia.org article about an event | News (or Timeline) | Freshness/News |
| 2 | A TechRadar / Wirecutter review | Review | Evaluation |
| 3 | A "iPhone X vs Galaxy Y" comparison post | Comparison | Comparison |
| 4 | A "Best phones under 30k" listicle | Best Listicle | Recommendation |
| 5 | A retailer PDP (amazon.com or flipkart) | PDP / Specs / Price | Transactional |
| 6 | A how-to article (e.g. "how to reset router") | How-to / Tutorial | Troubleshooting |
| 7 | A benchmark page (e.g. notebookcheck) | Benchmark / Testing | Specific Fact |
| 8 | A FAQ-style answer page (Quora/Stack/short blog) | Fact / FAQ | Specific Fact |
| 9 | A "best phone for X" buying guide | Buying Guide | Recommendation |
| 10 | A Wikipedia overview article (e.g. LLM page) | (open — likely Fact/FAQ or Listicle) | Informational |

**Validation criteria**
- Page type correct on ≥ **8/10** URLs
- Intent correct on ≥ **8/10** URLs
- No 502/500 errors across the run
- Scores within ±10 across two runs of the same URL (looser than the ±5 we had for 7-dim, since 9-dim output has more freedom to vary)
- Each report has 5+ fixes with at least one Critical or High priority
- Each report has 3+ strengths and 3+ weaknesses
- `estimatedImpact` correlates with `overallScore` (low scores → High impact; high scores → Low impact)

**Done when**
- All 10 URLs analyzed, results recorded in `TESTS.md`
- Accuracy bars met (or specific failures documented with a hypothesis)
- One commit per phase total across the migration (4 commits expected: Phase 1 atomic swap, Phase 2 types/schema, Phase 3 UI, Phase 4 TESTS.md)
