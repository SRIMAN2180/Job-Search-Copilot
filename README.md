# Job Search Copilot

A Kanban board for tracking job applications with AI-powered cover letters, resume tailoring, interview prep, and live job search. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Kanban Board** — Drag-and-drop columns (Wishlist → Applied → Interviewing → Offer → Rejected)
- **AI Application Kit** — Generate cover letters, tailored resume bullets, interview questions, and company briefs via Open Router (supports GPT, Claude, Mistral, etc.)
- **Live Job Search** — Searches DuckDuckGo, scrapes LinkedIn/Indeed/Glassdoor for real listings, ranks results by relevance to your resume
- **Dark Editorial Design** — Playfair Display headings, amber accents, dot-grid background, smooth animations
- **Fully Client-Side** — All data in localStorage, no database, no auth, no backend needed

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to Settings where you need:
- An **Open Router API key** (get one at https://openrouter.ai/keys)
- Your **resume** (upload a PDF or TXT file)

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Production build + type check |
| `npm run lint` | Lint the codebase |

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** React 18, TypeScript, Tailwind CSS 3
- **Drag & Drop:** @dnd-kit/core
- **AI:** Open Router API (bring your own key)
- **Search:** DuckDuckGo via cheerio HTML parsing
- **Storage:** Browser localStorage (no database required)
