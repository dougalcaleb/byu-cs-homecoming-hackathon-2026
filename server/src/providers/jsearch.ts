import type { JobPosting } from '../../../shared/types'
import { fetchJsonCached } from '../cache'
import {
	SEARCH_TTL_MS,
	formatSalary,
	inferWorkplace,
	toIso,
	type SearchProvider,
	type SearchQuery,
} from './common'

// One result from OpenWebNinja's JSearch `search-v2` endpoint.
// Field names come from the API docs and have not been checked against a live response yet.
export interface RawJSearchJob {
	job_id?: string
	job_title?: string
	employer_name?: string
	employer_logo?: string
	job_publisher?: string
	job_employment_type?: string
	job_description?: string
	job_highlights?: { Qualifications?: string[]; Responsibilities?: string[]; Benefits?: string[] }
	job_location?: string
	job_is_remote?: boolean
	work_arrangement?: string
	job_min_salary?: number | null
	job_max_salary?: number | null
	job_salary_period?: string | null
	job_posted_at_datetime_utc?: string
	job_apply_link?: string
	apply_options?: { publisher?: string; apply_link?: string }[]
}

interface JSearchResponse {
	data?: RawJSearchJob[]
	cursor?: string
}

export function normalizeJSearchJob(raw: RawJSearchJob): JobPosting | null {
	if (!raw.job_id || !raw.job_title || !raw.employer_name) return null

	const applyLinks = (raw.apply_options ?? []).flatMap((option) =>
		option.apply_link ? [{ label: option.publisher ?? 'Apply', url: option.apply_link }] : [],
	)
	if (applyLinks.length === 0 && raw.job_apply_link) {
		applyLinks.push({ label: raw.job_publisher ?? 'Apply', url: raw.job_apply_link })
	}

	return {
		id: `jsearch:${raw.job_id}`,
		provider: 'jsearch',
		title: raw.job_title,
		company: raw.employer_name,
		location: raw.job_location,
		workplace: raw.job_is_remote
			? 'remote'
			: inferWorkplace(raw.work_arrangement, raw.job_location),
		description: raw.job_description ?? '',
		highlights: {
			qualifications: raw.job_highlights?.Qualifications ?? [],
			responsibilities: raw.job_highlights?.Responsibilities ?? [],
			benefits: raw.job_highlights?.Benefits ?? [],
		},
		employmentType: raw.job_employment_type,
		salary: formatSalary(
			raw.job_min_salary,
			raw.job_max_salary,
			'USD',
			raw.job_salary_period ?? undefined,
		),
		postedAt: toIso(raw.job_posted_at_datetime_utc),
		source: raw.job_publisher,
		companyLogoUrl: raw.employer_logo,
		applyLinks,
	}
}

export const jsearch: SearchProvider = {
	name: 'jsearch',
	isConfigured: () => !!process.env.JSEARCH_KEY,
	async search(query: SearchQuery) {
		// JSearch takes location as part of the query text
		const q = query.location ? `${query.q} in ${query.location}` : query.q
		const params = new URLSearchParams({ query: q, country: 'us' })
		if (query.remoteOnly) params.set('work_from_home', 'true')
		if (query.page) params.set('cursor', query.page)

		const body = await fetchJsonCached<JSearchResponse>(
			`https://api.openwebninja.com/jsearch/search-v2?${params}`,
			{ ttlMs: SEARCH_TTL_MS, headers: { 'x-api-key': process.env.JSEARCH_KEY ?? '' } },
		)
		return {
			jobs: (body.data ?? []).flatMap((raw) => normalizeJSearchJob(raw) ?? []),
			nextPage: body.cursor,
		}
	},
}
