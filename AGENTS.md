# Pipeline — Job Application Tracker

## Commands

```bash
npm run dev          # local dev server on port 3000
npm run build        # production build + typecheck
npm run lint         # lint
npm run feature:done # add entry to Progress/Done in AGENTS.md
```

Use `next.config.mjs` (not `.ts` — Next.js 14 does not support `.ts` config).

## Architecture

- **Next.js 14 App Router**, React 18, TypeScript, Tailwind CSS 3
- All state in `localStorage` — no database, no auth
- Four API routes in `src/app/api/` — all proxied to Open Router:
  - `generate` — single prompt returns cover letter + 4 resume bullets + 5 interview questions + company brief
  - `scrape` — fetches URL HTML, optionally uses Open Router for structured extraction
  - `resume-parse` — PDF text extraction via `pdf-parse`
  - `job-search` — generates queries via LLM, searches DuckDuckGo, scrapes job board pages for individual listings
- `@dnd-kit/core` for drag-and-drop (useDraggable per card, useDroppable per column). PointerSensor with 8px activation distance to distinguish click vs drag.
- **Job search** at `/api/job-search` — uses Open Router to generate search queries from resume + structured preferences (titles, locations, work mode, salary, keywords, excludes), searches DuckDuckGo via `cheerio` HTML parsing, then scrapes job board pages (LinkedIn, Indeed, Glassdoor, etc.) to extract individual job listings with company names and direct apply URLs. Results are deduplicated and ranked by relevance using the same LLM. Cheap default model: `openai/gpt-4o-mini`. Search preferences are saved in `localStorage` under `pipeline-search-prefs`.
- Company name is extracted from job board page scraping (URL domain + HTML parsing). If the API can't determine the company, the frontend prompts the user to enter it when clicking "Add".
- Delete job with inline confirmation ("Delete this job? Yes / No") in JobDetailModal.

## Key conventions

- All interactive components use `"use client"` directive
- Path alias `@/*` maps to `src/*`
- `pdf-parse` has no types — declaration file at `src/types/pdf-parse.d.ts`
- Open Router API key is sent from browser to API routes in POST body (not serverside env var — user brings their own key via Settings UI)
- No `.env.local` needed unless you want to hardcode for testing
- Stale `.next` cache causes `Cannot find module` errors — delete `.next` and rebuild (`Remove-Item -Recurse .next; npm run dev`)

## Generate route quirks

- Do **not** use `response_format: { type: "json_object" }` — breaks non-OpenAI models on Open Router. The prompt explicitly asks for JSON instead, and the route has a fallback that extracts JSON from markdown-wrapped responses (```json ... ```).
- Must set `max_tokens: 4096` — without it, some Open Router models default to ~1024 and truncate the later fields (interview questions, company brief).
- Response is validated field-by-field with defaults (`""` / `[]`).
- Accepts optional `section` param (`"coverLetter"`, `"resumeBullets"`, `"interviewQuestions"`, `"companyBrief"`) for single-section regeneration. When provided, only that prompt template is used; the response still returns all 4 fields but only the requested one has data. The client in `JobDetailModal` merges by section to avoid wiping other fields.

## Data model

```ts
interface Job {
  id: string; title: string; company: string; url?: string;
  description: string; notes: string;
  status: 'wishlist' | 'applied' | 'interviewing' | 'offer' | 'rejected';
  createdAt: number; updatedAt: number; kit?: Kit;
}
interface Kit {
  coverLetter: string; resumeBullets: string[];
  interviewQuestions: string[]; companyBrief: string;
}
```

## Resume input

Settings page supports only file upload (PDF/DOC/TXT). LinkedIn URL scrape and plain text paste have been removed.

## Column status strings

Must match exactly: `wishlist`, `applied`, `interviewing`, `offer`, `rejected`. Used as droppable IDs in DnD.

## Design system (Dark Editorial)

- **Theme:** Dark (`page: #0a0a0b`, `surface: #18181b`, `border: #27272a`). Accent is amber (`#d97706`).
- **Fonts:** Playfair Display (headings, via `--font-heading` CSS var) and Instrument Sans (body, via `--font-body`). Imported via `next/font/google` in `layout.tsx`. Heading class has `letter-spacing: 0.03em` defined in `globals.css` @layer components to prevent compressed look.
- **Background:** Subtle dot-grid via `radial-gradient` on `body` in `globals.css`.
- **Animations:** `fadeIn`, `slideUp`, `glowPulse` keyframes defined in Tailwind config. `animate-slide-up` on dialogs, `animate-glow-pulse` on the Generate Kit button.
- **Tab switchers** (when present) use a `bg-surface-secondary` pill container with `bg-surface` + `shadow-sm` for active state.
- **Cards:** Hover state adds `border-accent/40` and a subtle amber shadow glow. Drag state uses `opacity-30 scale-105`.
- **Custom scrollbar** styled in `globals.css`. `::selection` uses amber tint.

## Progress

### Done

- Improved generate route: detailed cover letter prompt (300+ words, 4-5 paragraph structure, tone/format requirements), increased `max_tokens` from 4096 to 8192, added 120s AbortController timeout to prevent hanging
- Increased cover letter textarea from 6 to 14 rows and company brief textarea from 6 to 10 rows in JobDetailModal for better readability without scrolling
- Added loading message during kit generation ("30–60 seconds depending on model")
- Created two opencode sub-agents for the project: `code-reviewer` (bugs, quality, types) and `security-reviewer` (vulnerabilities, data exposure, API key safety) — defined in `.opencode/agent/` with `edit: deny` permission
- Project-level `opencode.json` created with `$schema` and `instructions: ["AGENTS.md"]`
- Company extraction moved from frontend to backend job-search API — returns `company` field per result
- Delete job feature in JobDetailModal with "Delete this job? Yes / No" inline confirmation
- Company fallback in job search — if API can't extract a company name, user is prompted to enter it when clicking "Add"
- Job search rewritten to scrape actual job board pages (LinkedIn, Indeed, Glassdoor, etc.) via cheerio for individual listings instead of showing search result page snippets
- Fixed DDG URL extraction — now decodes redirect URLs (`uddg` param) to get real target URLs
- `npm run feature:done` script to log completed features to AGENTS.md
- Fixed: jobs added via JobSearchModal now appear on the board immediately (no refresh needed) — `onAdd` callback syncs state
- Full code review + security review via sub-agents; all findings fixed:
  - SSRF guards in `/api/scrape` and `/api/job-search` — URL validation (blocks private IPs), AbortController timeouts (15s), response size limits (5MB)
  - `javascript:` URL injection prevented — `job.url` sanitized via `new URL()` + protocol check before rendering in `<a href>`
  - JSON.parse wrapped in try/catch in `storage.ts` — app no longer crashes on corrupted localStorage
  - File size limit (10MB) on PDF upload in `/api/resume-parse`
  - `response_format: { type: "json_object" }` removed from scrape + job-search routes (breaks non-OpenAI models)
  - All handler closures converted to functional updaters (stale closure bugs fixed)
  - Dual-write anti-pattern fixed — `JobSearchModal.handleAdd` no longer writes to localStorage directly; KanbanBoard's `onAdd` is single source of truth
  - Prompt injection guards added to all LLM prompts (`SYSTEM_GUARD` prefix + `=== BEGIN/END ===` delimiters)
  - `GenerateKit.tsx` deleted (dead code)
  - `.doc,.docx` removed from settings file accept list (API doesn't support them)
  - `JobDetailModal` editing states sync via `useEffect` when `job.id` changes
  - API key missing now shows inline error instead of silent return
  - JobSearchModal indigo accent replaced with amber for design consistency
  - Dialog body overflow uses counter for safe multi-modal handling
  - Cross-tab localStorage sync via `window.addEventListener("storage")`
  - Drag listeners + onClick separated in JobCard to prevent conflicts
  - Upstream error messages sanitized — no longer forwarded to client
  - Simulated `setTimeout` saving indicators replaced with immediate state toggle

### In Progress

- (none)
