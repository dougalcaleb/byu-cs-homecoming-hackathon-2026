# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**This is a living document.** Whenever a change you make (or one you notice) makes anything here stale — new commands, routes, stores, types, architecture shifts, resolved TODOs — update this file immediately as part of the same change, without being asked.

## Project

**Gig Glide** — a hackathon project (BYU CS Homecoming Hackathon 2026, prompt: "improve the job hunt"). A gamified job-hunt app: the user uploads a resume, swipes through job postings dating-app style, and for jobs they like the app analyzes the match and helps them tweak their resume/application to fit the posting as closely as possible.

Currently only the frontend exists, in [client/](client/). There is no backend yet; resume parsing, job fetching, and match analysis are planned, and mock data stands in for them.

## Commands

All commands run from `client/` (Node `^22.18.0 || >=24.12.0`):

```sh
npm install
npm run dev          # Vite dev server
npm run build        # vue-tsc type-check + vite build (in parallel)
npm run type-check   # vue-tsc --build only
npm run lint         # oxlint --fix, then eslint --fix
npm run format       # prettier on src/
```

There is no test runner configured.

## Stack

Vue 3 (`<script setup lang="ts">`), Vite, Pinia (setup-style stores), Vue Router, Tailwind CSS v4 (via `@tailwindcss/vite`, no config file). `@/` aliases `client/src/`.

Style: tabs, no semicolons, single quotes, 100-char lines (`.editorconfig` + `.prettierrc.json`).

## Architecture

**Data contracts live in [client/src/types/index.ts](client/src/types/index.ts).** Every feature (resume parsing, job fetch, swipe deck, match view) reads and writes these shapes; change them there first and tell the team. Core flow of types: `Resume` (with a derived `SearchProfile` that drives job search) → `JobPosting` → `Swipe` (like/pass) → `MatchAnalysis` (score, `Highlight`s, `Gap`s, `Tip`s).

**Quote anchoring.** `Resume.rawText` is the verbatim extracted resume text and must never be reformatted. `Highlight.resumeQuote` / `Tip.resumeQuote` must be exact substrings of `rawText`, and `jobQuote`s exact substrings of `JobPosting.description`. [locateQuote.ts](client/src/lib/locateQuote.ts) finds them tolerating whitespace/case differences and returns `null` when absent — the UI should skip that highlight rather than fail. Mock data in [client/src/mocks/](client/src/mocks/) follows the same rule.

**Stores** ([client/src/stores/](client/src/stores/)) — `resume`, `jobs`, `matches`. Each wraps loadable values in `AsyncState<T>` (`idle | loading | ready | error`) and exposes `setLoading` / `set*` / `setError` / `clear`. Stores don't fetch anything themselves; callers drive the state transitions.
- `jobs` holds postings plus a `swipes` map keyed by job id; `deck` = unswiped jobs, `liked` = liked jobs.
- `matches` is keyed by job id. Analyses are tied to one resume, so `clear()` it when the resume changes.

**Persistence.** [storage.ts](client/src/lib/storage.ts) `loadStored` / `persist` sync store state to `localStorage` under `gig-glide:*` keys. Only `ready` data is persisted/restored. The jobs and matches keys are versioned (`gig-glide:jobs:v2`, `gig-glide:matches:v3`); bump them when the saved shape or the mock data changes so stale saved data is ignored.

**Ways to Improve.** [ImproveView.vue](client/src/views/ImproveView.vue) (route `/improve/:jobId`, name `improve`) lists a match's `Gap`s as Required (`severity: 'major'`) and Nice to have, each with external learning links. Each `Gap` carries a short searchable `skill` and an optional `category` (`GapCategory`), which the match analysis must supply. Links are `LearningResource`s built by [learningResources.ts](client/src/lib/learningResources.ts) `resourcesForGap`: hand-picked `CURATED` links first, then search URLs on learning sites chosen by category (`credential` gaps get none). **URLs are always built by our code; never render a URL taken from LLM output.** The "Ways to improve" button lives at the bottom of [JobDetails.vue](client/src/components/JobDetails.vue); the page's Back link returns to `/?details=<jobId>`, which makes `HomeView` reopen that job's details instead of the swipe card.

**Job provider.** [normalizeJob.ts](client/src/lib/normalizeJob.ts) maps SerpApi Google Jobs (`jobs_results`) entries to `JobPosting`, dropping entries without id/title/company and deduping by id. Switching providers should only require changing this file.

**Layout.** [App.vue](client/src/App.vue) renders a sidebar (drawer on mobile, fixed on `lg+`) and lets content fill the width beside it; each view sets its own width (e.g. `mx-auto max-w-2xl`). Theme colors are Tailwind `@theme` tokens in [main.css](client/src/assets/main.css) (`page`, `surface`, `card`, `border`, `muted`, `accent`, `accent-soft`); the app is dark-only. [HomeView.vue](client/src/views/HomeView.vue) is the swipe deck, a phone-width column showing the first unswiped job; a right swipe slides the card away to reveal [JobDetails.vue](client/src/components/JobDetails.vue) underneath. Swipes are still local state there (the deck does not advance and nothing is written to the `jobs` store yet), and it seeds the stores from mocks. The sidebar links to a `/profile` route that doesn't exist yet.
