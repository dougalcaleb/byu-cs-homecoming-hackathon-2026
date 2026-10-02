# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**This is a living document.** Whenever a change you make (or one you notice) makes anything here stale — new commands, routes, stores, types, architecture shifts, resolved TODOs — update this file immediately as part of the same change, without being asked.

## Project

**Gig Glide** — a hackathon project (BYU CS Homecoming Hackathon 2026, prompt: "improve the job hunt"). A gamified job-hunt app: the user uploads a resume, swipes through job postings dating-app style, and for jobs they like the app analyzes the match and helps them tweak their resume/application to fit the posting as closely as possible.

Layout: [client/](client/) (Vue frontend), [server/](server/) (Hono API: job sourcing and ML ranking), [shared/](shared/) (types used by both). Client-side resume extraction and ingestion is built with PDF.js and Mammoth in [client/src/lib/resumeExtractor.ts](client/src/lib/resumeExtractor.ts) and [client/src/lib/resumeParser.ts](client/src/lib/resumeParser.ts); match analysis is planned, and mock data in [client/src/mocks/](client/src/mocks/) stands in for it. Routes include `/splash`, `/login`, `/onboarding`, `/`, `/profile`, `/about`, `/improve/:jobId`.

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
npm run simulate     # offline eval of the ranking model with simulated swipers
npm run format       # prettier on src/ and ../shared/
```

Vite proxies `/api` to the server, so the browser only talks to :5173. There is no test runner configured. Server env vars go in `server/.env` (see `.env.example`); `SERPAPI_KEY` / `JSEARCH_KEY` are optional.

Gotchas:
- On Windows, killing a backgrounded dev command (rather than Ctrl+C in a terminal) can leave child node processes holding ports 5173/8787; kill whatever owns those ports before restarting.
- Inside npm scripts, every ancestor `node_modules/.bin` is on PATH, so bare `npm` can resolve to a stray old npm (this once downgraded lockfiles to v2 and injected a `file:..` dependency). Inherited `npm_*` env vars cause the `file:..` problem on their own. `install-all.mjs` runs the parent npm via `npm_execpath` with `npm_*` stripped; do the same for any new script that shells out to npm.

## Stack

Client: Vue 3 (`<script setup lang="ts">`), Vite, Pinia (setup-style stores), Vue Router, Tailwind CSS v4 (via `@tailwindcss/vite`, no config file). `@/` aliases `client/src/`.

Server: Hono on `@hono/node-server`, run directly from TypeScript with `tsx` (no build step). `@huggingface/transformers` runs a local embedding model (ONNX; ~500MB of node_modules, model downloaded to `server/.cache/models/` on first run). HTML handling is hand-rolled.

Style (both): tabs, no semicolons, single quotes, 100-char lines (root `.editorconfig` + `.prettierrc.json`).

## Architecture

**Data contracts live in [shared/types.ts](shared/types.ts).** It must stay types-only: [client/src/types/index.ts](client/src/types/index.ts) re-exports it with `export type *` so Vite never serves files outside `client/`; client code imports from `@/types`, server code by relative path. Every feature (resume parsing, job fetch, swipe deck, match view) reads and writes these shapes; change them there first and tell the team. Core flow of types: `Resume` (with a derived `SearchProfile` that drives job search) → `JobPosting` → `Swipe` (like/pass) → `MatchAnalysis` (score, `Highlight`s, `Gap`s, `Tip`s).

**Quote anchoring.** `Resume.rawText` is the verbatim extracted resume text and must never be reformatted. `Highlight.resumeQuote` / `Tip.resumeQuote` must be exact substrings of `rawText`, and `jobQuote`s exact substrings of `JobPosting.description`. [locateQuote.ts](client/src/lib/locateQuote.ts) finds them tolerating whitespace/case differences and returns `null` when absent — the UI should skip that highlight rather than fail. Mock data in [client/src/mocks/](client/src/mocks/) follows the same rule.

**Stores** ([client/src/stores/](client/src/stores/)) — `resume`, `jobs`, `matches`. Each wraps loadable values in `AsyncState<T>` (`idle | loading | ready | error`) and exposes `setLoading` / `set*` / `setError` / `clear`. Stores don't fetch anything themselves; callers drive the state transitions.
- `jobs` holds postings plus a `swipes` map keyed by job id; `deck` = unswiped jobs, `liked` = liked jobs. It also keeps the API's `Recommendation` per job id (`recommendations`: score, skill tags, reasons); `addRecommendations(batch)` appends a batch from the API to the queue, skipping jobs it already holds.
- `matches` is keyed by job id. Analyses are tied to one resume, so `clear()` it when the resume changes.

**Persistence.** [storage.ts](client/src/lib/storage.ts) `loadStored` / `persist` sync store state to `localStorage` under `gig-glide:*` keys. Only `ready` data is persisted/restored. The jobs and matches keys are versioned (`gig-glide:jobs:v5`, `gig-glide:matches:v4`); bump them when the saved shape or the mock data changes so stale saved data is ignored. Also saved: `gig-glide:recommendations:v1` (the API's per-job scores) and `gig-glide:brand-colors:v1` (logo colors sampled for card gradients).

**Ways to Improve.** [ImproveView.vue](client/src/views/ImproveView.vue) (route `/improve/:jobId`, name `improve`) lists a match's `Gap`s as Required (`severity: 'major'`) and Nice to have, each with external learning links. The page is a summary strip ([ScoreRing.vue](client/src/components/improve/ScoreRing.vue) plus skill pills that jump to a card) above an accordion of [GapCard.vue](client/src/components/improve/GapCard.vue)s, one open at a time; amber marks Required, blue Nice to have, and the first resource is shown as the "Start here" button. Real match analysis doesn't exist yet, so when the `matches` store has no analysis for a job, the page derives one from the job's API `Recommendation` ([gapAnalysis.ts](client/src/lib/gapAnalysis.ts) `analysisFromRecommendation`): each `missingSkills` tag becomes a `Gap`, `major` when a qualification line names it without "preferred/bonus/plus" wording, with that line as the `jobQuote`. This derived analysis is computed on the fly and not stored. Each `Gap` carries a short searchable `skill` and an optional `category` (`GapCategory`), which the match analysis must supply. Links are `LearningResource`s built by [learningResources.ts](client/src/lib/learningResources.ts) `resourcesForGap`: hand-picked `CURATED` links first, then search URLs on learning sites chosen by category (`credential` gaps get none). **URLs are always built by our code; never render a URL taken from LLM output.** The "Ways to improve" button lives at the bottom of [JobDetails.vue](client/src/components/JobDetails.vue); the page's Back link returns to `/?details=<jobId>`, which makes `HomeView` reopen that job's details instead of the swipe card.

**Job sourcing (server).** Two kinds of sources, each with a converter in [server/src/providers/](server/src/providers/) that maps raw API data to `JobPosting`:
- *ATS job boards* (Greenhouse, Lever, Ashby): free, keyless, full descriptions, fetched per company. [boards.ts](server/src/boards.ts) lists the companies (Utah-heavy). [pool.ts](server/src/pool.ts) loads every board into an in-memory pool (~9k jobs, ~5s cold).
- *Search APIs* (JSearch, then SerpApi; first one with a key wins): quota-limited, only used by [candidates.ts](server/src/candidates.ts) when retrieval yields too few candidates. JSearch field names are from its docs and haven't been checked against a live response.

`JobPosting.id` is `provider:…` namespaced (`greenhouse:{token}:{id}`, `serpapi:{id}`, mock jobs use `mock:job-N`). `description` is always plain text: HTML is converted by [html.ts](server/src/providers/html.ts), which also builds `highlights` from bullet lists under recognizable headings (`classifyHeading`). `postedAt` is ISO.

[cache.ts](server/src/cache.ts) caches **raw** responses on disk in `server/.cache/` (boards 6h, searches 24h), so converter changes apply without refetching, and stale data is served if the network fails.

**Ranking (server, [server/src/rank/](server/src/rank/)).** `POST /api/jobs/recommendations` (`RecommendationsRequest` → `RecommendationsResponse`; client helper `fetchRecommendations` in [api.ts](client/src/lib/api.ts)) returns `Recommendation`s: the job, a 0–100 `score` (predicted chance of a right swipe), matched/missing `SkillTag`s (with Simple Icons slugs) and short `reasons`, plus a `TasteSummary`. Stateless: the client sends the full swipe history every time and the model is retrained from it per request. Pipeline in [recommend.ts](server/src/rank/recommend.ts):
1. *Train*: replay swipes in order through [model.ts](server/src/rank/model.ts), an online logistic regression (SGD, L2 pull toward hand-set `PRIOR_WEIGHTS` that handle cold start). Liked/passed job embeddings are also averaged into taste vectors.
2. *Retrieve* ([candidates.ts](server/src/candidates.ts)): union of keyword top-150 and embedding top-150 from the pool. Hard filters (`isOutOfReach`): senior titles for intern/entry users, jobs only open outside the US.
3. *Score*: [features.ts](server/src/rank/features.ts) builds a sparse vector per job: resume↔job semantic similarity, skill coverage, title match, seniority fit, reachability, recency, similarity to liked/passed taste vectors, plus `skill:*` / `workplace:*` one-hots whose weights are learned only from swipes.
4. *Order*: dedupe by title+company, then MMR diversification over embeddings with a same-company penalty. Reasons come from the largest feature contributions.

[embeddings.ts](server/src/rank/embeddings.ts): local `all-MiniLM-L6-v2` (384-d, normalized). The whole pool is embedded in the background at startup (~4 min the first time) and cached in `server/.cache/job-embeddings.*`; requests embed any missing candidates on demand, so they are slow until indexing finishes (`GET /api/health` shows progress). All model calls go through one queue.

[skills.ts](server/src/rank/skills.ts) is the skill dictionary (~130 skills, aliases, icon slugs) with a single-pass n-gram matcher. Skills whose name is a common word (`ambiguous: true`: Go, C, R, Excel, Spring, Swift) match only via longer aliases; a company's own name is never counted as a skill of its postings. All icon slugs were checked against cdn.simpleicons.org. The client's [techStack.ts](client/src/lib/techStack.ts) is an older, smaller list (and its `amazonwebservices`/`tableau` slugs 404); prefer the server's `SkillTag`s once the UI uses recommendations.

`GET /api/jobs/pool` shows pool counts for debugging.

**Layout.** [App.vue](client/src/App.vue) renders a sidebar (drawer on mobile, fixed on `lg+`) and lets content fill the width beside it; each view sets its own width (e.g. `mx-auto max-w-2xl`). Theme colors are Tailwind `@theme` tokens in [main.css](client/src/assets/main.css) (`page`, `surface`, `card`, `border`, `muted`, `accent`, `accent-soft`); the app is dark-only. [HomeView.vue](client/src/views/HomeView.vue) is the swipe deck, a phone-width column showing the first unswiped job; a right swipe slides the card away to reveal [JobDetails.vue](client/src/components/JobDetails.vue) underneath. The deck is the real queue: HomeView calls `fetchRecommendations` (resume `searchProfile` + `skills` + `rawText` + the swipe history) and tops the `jobs` store up with `addRecommendations` whenever 5 or fewer unswiped jobs are left, showing loading, error (with retry) and "add your resume" states when it has no job to show. A left swipe records a `pass` in the `jobs` store and slides the prerendered next card in as a carousel; a right swipe still only opens the details (it does not record a `like` yet). Cards ([JobCard.vue](client/src/components/JobCard.vue)) take the match % and skill chips from the job's `Recommendation`, falling back to a stored match analysis / a keyword scan of the description. Cover art ([JobCardCover.vue](client/src/components/JobCardCover.vue), [brand.ts](client/src/lib/brand.ts)): the posting's own `companyLogoUrl` if it loads, else a logo.dev lookup by company name (publishable key in `client/.env.local` as `VITE_LOGO_DEV_TOKEN`, see `client/.env.example`), else a monogram; the card gradient is sampled from the logo, or derived from the company name. Logos are prefetched for the whole queue. logo.dev's free tier requires a visible attribution link, so [AppSidebar.vue](client/src/components/AppSidebar.vue) shows "Logos provided by Logo.dev" whenever the token is set (keep that if you move it). Its `/name/` lookup is fuzzy and reports no match info, so an obscure company can get another brand's logo; the secret-key Search API (server-side only, never in client code) would be the way to verify matches. The `rise` class in `main.css` is the shared entrance animation (stagger with `animation-delay`).

**Profile.** [ProfileView.vue](client/src/views/ProfileView.vue) (route `/profile`) shows the saved `Resume` from the `resume` store: hero card, a profile-strength [ScoreRing](client/src/components/improve/ScoreRing.vue) with missing items as pills, then one [ProfileSection.vue](client/src/components/profile/ProfileSection.vue) card per resume section. Editing reuses the ingester: every Edit link goes to `/onboarding?edit=1&step=N` (0 Upload, 1 Contact, 2 Experience, 3 Skills, 4 Confirm), plus `&focus=<name>` to scroll to one block on that step and flash the `.section-focus` highlight from `main.css`. `focus` matches a `data-section` attribute on a block in the step components (`summary`, `skills`, `projects`, `certifications`, `experience`, `education`) or a contact input id suffix (`contact-<name|email|phone|location>`); add a `data-section` to any new block that should be reachable this way. In that mode [OnboardingView.vue](client/src/views/OnboardingView.vue) pre-fills its form from the saved resume, keeps the resume's `id` / `uploadedAt` / seniority unless a new file is uploaded, and returns to `/profile` on save or Cancel. Saving an edit does not clear the `matches` store yet (analyses are still mocks); do that once real analysis exists.
