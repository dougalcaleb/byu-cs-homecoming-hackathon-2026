import type { CandidatesRequest, JobPosting, SearchProfile } from '../../shared/types'
import { isNearby, isOpenToUs, parsePlace, type Place } from './location'
import { getPool } from './pool'
import { activeSearchProvider } from './providers'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200
// Below this many pool matches, spend search-API quota to top up
const MIN_POOL_MATCHES = 20
const MAX_SEARCH_QUERIES = 3

const SENIOR_TITLE = /\b(senior|sr\.?|staff|principal|lead|manager|director|head of|vp|chief)\b/i
const INTERN_TITLE = /\b(intern|internship|co-?op|student)\b/i

// Candidate generation: a cheap first pass that narrows thousands of pooled jobs to a few dozen
// plausible ones. Fine-grained ordering (skill overlap, swipe feedback) happens after this.
export async function findCandidates(request: CandidatesRequest): Promise<JobPosting[]> {
	const { profile } = request
	const limit = Math.min(request.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
	const exclude = new Set(request.exclude)
	const place = profile.location ? parsePlace(profile.location) : undefined

	const scored = (await getPool())
		.filter((job) => !exclude.has(job.id))
		.map((job) => ({ job, score: relevance(job, profile, place) }))
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score)
	// Dedupe after sorting so the best-scoring copy of a multi-location role is kept
	let jobs = dedupe(scored.map(({ job }) => job)).slice(0, limit)

	if (jobs.length < MIN_POOL_MATCHES) {
		const searched = await searchFallback(profile)
		jobs = dedupe([...jobs, ...searched.filter((job) => !exclude.has(job.id))]).slice(0, limit)
	}
	return jobs
}

function relevance(job: JobPosting, profile: SearchProfile, place: Place | undefined) {
	const junior = profile.seniority === 'intern' || profile.seniority === 'entry'
	if (junior && SENIOR_TITLE.test(job.title)) return 0

	const titleWords = words(job.title)
	const titleScore = Math.max(
		0,
		...profile.titles.map((title) => {
			const wanted = [...words(title)]
			return wanted.length
				? wanted.filter((w) => titleWords.has(w)).length / wanted.length
				: 0
		}),
	)

	const text = `${job.title}\n${job.description}`.toLowerCase()
	const keywordScore = profile.keywords.length
		? profile.keywords.filter((keyword) => containsTerm(text, keyword)).length /
			profile.keywords.length
		: 0

	if (titleScore === 0 && keywordScore < 0.2) return 0

	let score = 3 * titleScore + 2 * keywordScore
	if (profile.seniority === 'intern' && INTERN_TITLE.test(job.title)) score += 1
	if (profile.remotePreference === 'remote' && job.workplace === 'remote') score += 0.5

	// Unreachable jobs (far away, or remote but restricted to another country) are demoted
	// rather than dropped
	if (place) {
		const reachable =
			job.workplace === 'remote'
				? !job.location || isOpenToUs(job.location)
				: !!job.location && isNearby(place, job.location)
		score *= reachable ? 1.25 : 0.3
	}
	return score
}

async function searchFallback(profile: SearchProfile): Promise<JobPosting[]> {
	const provider = activeSearchProvider()
	if (!provider) return []

	const queries = profile.titles.length
		? profile.titles
		: [profile.keywords.slice(0, 3).join(' ')]
	const results = await Promise.allSettled(
		queries
			.filter(Boolean)
			.slice(0, MAX_SEARCH_QUERIES)
			.map((q) =>
				provider.search({
					q,
					location: profile.location,
					remoteOnly: profile.remotePreference === 'remote',
				}),
			),
	)
	return results.flatMap((result) => {
		if (result.status === 'fulfilled') return result.value.jobs
		console.warn(`[search] ${provider.name} failed:`, (result.reason as Error).message)
		return []
	})
}

// The same posting often appears under different ids from different sources
function dedupe(jobs: JobPosting[]) {
	const seen = new Set<string>()
	return jobs.filter((job) => {
		const keys = [job.id, `${normalize(job.title)}|${normalize(job.company)}`]
		if (keys.some((key) => seen.has(key))) return false
		keys.forEach((key) => seen.add(key))
		return true
	})
}

function words(text: string) {
	return new Set(text.toLowerCase().match(/[a-z0-9+#]+/g) ?? [])
}

function normalize(text: string) {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim()
}

// Whole-term match that also works for terms like "C++", "Node.js" and "C#"
function containsTerm(text: string, term: string) {
	const escaped = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`).test(text)
}
