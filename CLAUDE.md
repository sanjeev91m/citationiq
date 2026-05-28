# CitationIQ — Working Agreement

## Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS
- **UI primitives:** shadcn/ui (Radix + Tailwind)
- **LLM:** Anthropic SDK (`@anthropic-ai/sdk`)
- **Content extraction:** `@mozilla/readability` + `jsdom`
- **Validation:** `zod` for all API boundaries and LLM JSON outputs

## Models

- **Scoring (`/api/analyze`):** `claude-opus-4-7` — quality matters; deterministic (`temperature: 0`)
- **Rewrites (`/api/rewrite`):** `claude-sonnet-4-5` — speed/cost tradeoff; mildly creative (`temperature: 0.3`). (Rewrites flow is slated for removal in the page-type-aware migration; see PLAN.md.)
- These are swappable via a single constant in `lib/anthropic.ts`. Do not hardcode model IDs anywhere else.

## Code style

- **Functional components only.** No class components.
- **Named exports only.** No default exports for components, hooks, or utilities. (Next.js route files like `page.tsx`, `layout.tsx`, `route.ts` are exempt where the framework requires it.)
- **Prefer composition over abstraction.** Three similar files is fine. Don't extract a shared helper until there's real duplication and a clear shape.
- **No comments unless the WHY is non-obvious.** Identifiers should be self-explanatory. Don't narrate what the code does.
- **Validate at boundaries.** Every API route validates input with zod. Every LLM call validates output with zod. Internal code trusts itself.
- **No premature features.** Don't add flags, fallbacks, or "future-proofing" beyond what the current phase requires.

## File layout

```
app/                      # Next.js App Router
  api/
    extract/route.ts      # URL → article text
    analyze/route.ts      # article → score report
    rewrite/route.ts      # score + article → rewrite blocks
  page.tsx                # landing
  analyze/page.tsx        # report
  layout.tsx
  globals.css
components/
  ui/                     # shadcn primitives (do not edit by hand; use shadcn CLI)
  *.tsx                   # app-specific components
lib/
  anthropic.ts            # shared Claude client + model constants
  extract.ts              # Readability + jsdom
  scoring.ts              # scoring orchestration
  scoring-prompt.ts       # LOCKED — see hard rule below
  rewrite.ts
  rewrite-prompt.ts
  history.ts              # localStorage CRUD
  score-color.ts
  utils.ts                # shadcn cn()
types/
  extract.ts
  score.ts
  rewrite.ts
  history.ts
hooks/
  use-copy-to-clipboard.ts
```

## Hard rules

### 🔒 The scoring prompt is locked

`lib/scoring-prompt.ts` is the product's core IP. **Do not refactor, restructure, "improve," or rewrite it without explicit approval from the user in the current conversation.** (Most recent approved rewrite: page-type-aware 9-dimension auditor, 2026-05-28. See PLAN.md migration section for the rationale.) This includes:

- Reorganizing sections
- Renaming dimensions
- Changing the JSON schema instructions
- "Tightening" wording
- Extracting it into smaller files

If you think it needs a change, **stop and ask first.** Quote the exact lines you'd change and explain why. The same rule applies to `lib/rewrite-prompt.ts` but with a slightly lower bar — still ask before changing it.

### 🔒 Stay on task

Do not refactor unprompted. If you notice unrelated tech debt, naming you don't love, or "this could be cleaner" opportunities while implementing the current task — **leave it alone.** Surface it in your end-of-turn summary, don't act on it.

A bug fix doesn't need surrounding cleanup. A one-shot operation doesn't need a helper. The current phase's acceptance criteria are the whole scope.

### 🔒 Commit after each working phase

After each phase in PLAN.md hits its acceptance criteria:
1. Verify the criteria locally (run dev server, hit the API, etc.)
2. Run `tsc --noEmit` and `next build` (when applicable)
3. Stage and commit with a message like `Phase N: <short description>`
4. Do not bundle multiple phases into one commit

If a phase fails its acceptance criteria, **fix it before moving on.** Don't paper over with TODOs.

## Environment

- `ANTHROPIC_API_KEY` is required server-side. Never read it client-side. Never log it.
- `.env.local` is gitignored. `.env.local.example` is the source of truth for required vars.

## Out of scope for MVP

These are explicitly **not** in the 6-phase plan. Do not implement them without a new conversation:

- Competitor URL comparison
- TL;DR / FAQ block *generation* (Phase 4 is rewrites of existing passages only)
- User auth, accounts, saved analyses in a real DB
- Streaming responses (full responses are fine for MVP)
- Rate limiting, billing, usage tracking
- Multi-language support
