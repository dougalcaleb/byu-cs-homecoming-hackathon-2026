# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**This is a living document.** Whenever a change you make (or one you notice) makes anything here stale — new commands, routes, stores, types, architecture shifts, resolved TODOs — update this file immediately as part of the same change, without being asked.

## Project

**Gig Glide** — a hackathon project (BYU CS Homecoming Hackathon 2026, prompt: "improve the job hunt"). A gamified job-hunt app: the user uploads a resume, swipes through job postings dating-app style, and for jobs they like the app analyzes the match and helps them tweak their resume/application to fit the posting as closely as possible.

Layout: [client/](client/) (Vue frontend), [server/](server/) (Hono API: job sourcing), [shared/](shared/) (types used by both). Resume parsing and match analysis are not built yet; mock data in [client/src/mocks/](client/src/mocks/) stands in for them.

## Commands

Node `^22.18.0 || >=24.12.0`. Local-only app; no deployment. `client/` and `server/` are separate npm projects, driven from the root:

```sh
# repo root
npm install          # installs root, then client/ and server/ (scripts/install-all.mjs)
npm run dev          # client (http://localhost:5173) + server (:8787) via concurrently
npm run type-check   # both projects

# client/
npm run dev          # Vite dev server
npm run build        # vue-tsc type-check + vite build (in parallel)
npm run type-check   # vue-tsc --build only
npm run lint         # oxlint --fix, then eslint --fix
npm run format       # prettier on src/

# server/
npm run dev          # tsx watch, http://localhost:8787
npm run type-check   # tsc --noEmit (also checks shared/)
npm run format       # prettier on src/ and ../shared/
```

Vite proxies `/api` to the server, so the browser only talks to :5173. There is no test runner configured. Server env vars go in `server/.env` (see `.env.example`); `SERPAPI_KEY` / `JSEARCH_KEY` are optional.

Gotchas:
- On Windows, killing a backgrounded dev command (rather than Ctrl+C in a terminal) can leave child node processes holding ports 5173/8787; kill whatever owns those ports before restarting.
- Inside npm scripts, every ancestor `node_modules/.bin` is on PATH, so bare `npm` can resolve to a stray old npm (this once downgraded lockfiles to v2 and injected a `file:..` dependency). Inherited `npm_*` env vars cause the `file:..` problem on their own. `install-all.mjs` runs the parent npm via `npm_execpath` with `npm_*` stripped; do the same for any new script that shells out to npm.

## Stack

Client: Vue 3 (`<script setup lang="ts">`), Vite, Pinia (setup-style stores), Vue Router, Tailwind CSS v4 (via `@tailwindcss/vite`, no config file). `@/` aliases `client/src/`.

Server: Hono on `@hono/node-server`, run directly from TypeScript with `tsx` (no build step). No other runtime deps; HTML handling is hand-rolled.

Style (both): tabs, no semicolons, single quotes, 100-char lines (root `.editorconfig` + `.prettierrc.json`).

## Architecture

**Data contracts live in [shared/types.ts](shared/types.ts).** It must stay types-only: [client/src/types/index.ts](client/src/types/index.ts) re-exports it with `export type *` so Vite never serves files outside `client/`; client code imports from `@/types`, server code by relative path. Every feature (resume parsing, job fetch, swipe deck, match view) reads and writes these shapes; change them there first and tell the team. Core flow of types: `Resume` (with a derived `SearchProfile` that drives job search) → `JobPosting` → `Swipe` (like/pass) → `MatchAnalysis` (score, `Highlight`s, `Gap`s, `Tip`s).

**Quote anchoring.** `Resume.rawText` is the verbatim extracted resume text and must never be reformatted. `Highlight.resumeQuote` / `Tip.resumeQuote` must be exact substrings of `rawText`, and `jobQuote`s exact substrings of `JobPosting.description`. [locateQuote.ts](client/src/lib/locateQuote.ts) finds them tolerating whitespace/case differences and returns `null` when absent — the UI should skip that highlight rather than fail. Mock data in [client/src/mocks/](client/src/mocks/) follows the same rule.

**Stores** ([client/src/stores/](client/src/stores/)) — `resume`, `jobs`, `matches`. Each wraps loadable values in `AsyncState<T>` (`idle | loading | ready | error`) and exposes `setLoading` / `set*` / `setError` / `clear`. Stores don't fetch anything themselves; callers drive the state transitions.
- `jobs` holds postings plus a `swipes` map keyed by job id; `deck` = unswiped jobs, `liked` = liked jobs.
- `matches` is keyed by job id. Analyses are tied to one resume, so `clear()` it when the resume changes.

**Persistence.** [storage.ts](client/src/lib/storage.ts) `loadStored` / `persist` sync store state to `localStorage` under `gig-glide:*` keys. Only `ready` data is persisted/restored. The jobs and matches keys are versioned (`gig-glide:jobs:v3`, `gig-glide:matches:v4`); bump them when the saved shape or the mock data changes so stale saved data is ignored.

**Ways to Improve.** [ImproveView.vue](client/src/views/ImproveView.vue) (route `/improve/:jobId`, name `improve`) lists a match's `Gap`s as Required (`severity: 'major'`) and Nice to have, each with external learning links. The page is a summary strip ([ScoreRing.vue](client/src/components/improve/ScoreRing.vue) plus skill pills that jump to a card) above an accordion of [GapCard.vue](client/src/components/improve/GapCard.vue)s, one open at a time; amber marks Required, blue Nice to have, and the first resource is shown as the "Start here" button. Each `Gap` carries a short searchable `skill` and an optional `category` (`GapCategory`), which the match analysis must supply. Links are `LearningResource`s built by [learningResources.ts](client/src/lib/learningResources.ts) `resourcesForGap`: hand-picked `CURATED` links first, then search URLs on learning sites chosen by category (`credential` gaps get none). **URLs are always built by our code; never render a URL taken from LLM output.** The "Ways to improve" button lives at the bottom of [JobDetails.vue](client/src/components/JobDetails.vue); the page's Back link returns to `/?details=<jobId>`, which makes `HomeView` reopen that job's details instead of the swipe card.

**Job sourcing (server).** Two kinds of sources, each with a converter in [server/src/providers/](server/src/providers/) that maps raw API data to `JobPosting`:
- *ATS job boards* (Greenhouse, Lever, Ashby): free, keyless, full descriptions, fetched per company. [boards.ts](server/src/boards.ts) lists the companies (Utah-heavy). [pool.ts](server/src/pool.ts) loads every board into an in-memory pool (~9k jobs, ~5s cold).
- *Search APIs* (JSearch, then SerpApi; first one with a key wins): quota-limited, only used by [candidates.ts](server/src/candidates.ts) when the pool yields too few matches. JSearch field names are from its docs and haven't been checked against a live response.

`JobPosting.id` is `provider:…` namespaced (`greenhouse:{token}:{id}`, `serpapi:{id}`, mock jobs use `mock:job-N`). `description` is always plain text: HTML is converted by [html.ts](server/src/providers/html.ts), which also builds `highlights` from bullet lists under recognizable headings (`classifyHeading`). `postedAt` is ISO.

[cache.ts](server/src/cache.ts) caches **raw** responses on disk in `server/.cache/` (boards 6h, searches 24h), so converter changes apply without refetching, and stale data is served if the network fails.

`POST /api/jobs/candidates` (`CandidatesRequest` → `CandidatesResponse`) is the coarse candidate-generation step: keyword/title relevance from `SearchProfile`, seniority filter, location demotion (assumes US users), dedupe by title+company. Fine ranking (skill overlap, swipe feedback) is planned as a separate step after it. The client calls it through [api.ts](client/src/lib/api.ts). `GET /api/jobs/pool` shows pool counts for debugging.

**Layout.** [App.vue](client/src/App.vue) renders a sidebar (drawer on mobile, fixed on `lg+`) and lets content fill the width beside it; each view sets its own width (e.g. `mx-auto max-w-2xl`). Theme colors are Tailwind `@theme` tokens in [main.css](client/src/assets/main.css) (`page`, `surface`, `card`, `border`, `muted`, `accent`, `accent-soft`); the app is dark-only. [HomeView.vue](client/src/views/HomeView.vue) is the swipe deck, a phone-width column showing the first unswiped job; a right swipe slides the card away to reveal [JobDetails.vue](client/src/components/JobDetails.vue) underneath. Swipes are still local state there (the deck does not advance and nothing is written to the `jobs` store yet), and it seeds the stores from mocks. The sidebar links to a `/profile` route that doesn't exist yet.
