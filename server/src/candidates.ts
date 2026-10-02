import type { JobPosting, SearchProfile } from '../../shared/types'
import type { Place } from './location'
import { getPool } from './pool'
import { activeSearchProvider } from './providers'
import { dot, jobVector } from './rank/embeddings'
import { isOutOfReach, isReachable, titleMatch } from './rank/signals'

// How many candidates each retrieval method contributes before ranking
const KEYWORD_K = 150
const SEMANTIC_K = 150
// Below this many candidates, spend search-API quota to top up
const MIN_CANDIDATES = 20
const MAX_SEARCH_QUERIES = 3

// Jobs from search APIs are not in the pool; remembered so later swipes on them can be trained on
const searchedJobs = new Map<string, JobPosting>()

export interface RetrieveOptions {
	exclude: Set<string>
	place?: Place
	// Resume embedding; enables semantic retrieval
	resumeVector?: Float32Array
}

// Candidate generation: narrows thousands of pooled jobs to a few hundred plausible ones, using
// two complementary methods. Keyword matching is precise about titles and named technologies;
// semantic (embedding) search finds related roles that share no exact words. The ranking model
// orders the union.
export async function retrieve(
	profile: SearchProfile,
	options: RetrieveOptions,
): Promise<JobPosting[]> {
	const eligible = (await getPool()).filter(
		(job) => !options.exclude.has(job.id) && !isOutOfReach(job, profile.seniority),
	)

	const byKeyword = topK(eligible, KEYWORD_K, (job) =>
		keywordRelevance(job, profile, options.place),
	)
	const { resumeVector } = options
	const bySemantic = resumeVector
		? topK(eligible, SEMANTIC_K, (job) => {
				const vector = jobVector(job)
				return vector ? dot(resumeVector, vector) : 0
			})
		: []

	const seen = new Set<string>()
	let candidates = [...byKeyword, ...bySemantic].filter(
		(job) => !seen.has(job.id) && !!seen.add(job.id),
	)

	if (candidates.length < MIN_CANDIDATES) {
		const searched = (await searchFallback(profile)).filter(
			(job) => !options.exclude.has(job.id) && !seen.has(job.id),
		)
		for (const job of searched) searchedJobs.set(job.id, job)
		candidates = [...candidates, ...searched]
	}
	return candidates
}

// Every job a swipe could refer to, by id
export async function jobsById(): Promise<Map<string, JobPosting>> {
	const jobs = new Map((await getPool()).map((job) => [job.id, job]))
	for (const [id, job] of searchedJobs) jobs.set(id, job)
	return jobs
}

function topK(jobs: JobPosting[], k: number, score: (job: JobPosting) => number) {
	return jobs
		.map((job) => ({ job, score: score(job) }))
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, k)
		.map(({ job }) => job)
}

function keywordRelevance(job: JobPosting, profile: SearchProfile, place: Place | undefined) {
	const title = titleMatch(job, profile.titles)
	const text = `${job.title}\n${job.description}`.toLowerCase()
	const keywords = profile.keywords.length
		? profile.keywords.filter((keyword) => containsTerm(text, keyword)).length /
			profile.keywords.length
		: 0
	if (title === 0 && keywords < 0.2) return 0

	const score = 3 * title + 2 * keywords
	return place && !isReachable(job, place) ? score * 0.3 : score
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

// The same posting often appears under different ids (other sources, other locations).
// Keeps the first occurrence, so call it on an already-ranked list.
export function dedupe<T>(items: T[], jobOf: (item: T) => JobPosting) {
	const seen = new Set<string>()
	return items.filter((item) => {
		const job = jobOf(item)
		const keys = [job.id, `${normalize(job.title)}|${normalize(job.company)}`]
		if (keys.some((key) => seen.has(key))) return false
		keys.forEach((key) => seen.add(key))
		return true
	})
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
