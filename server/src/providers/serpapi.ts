import type { JobPosting } from '../../../shared/types'
import { fetchJsonCached } from '../cache'
import {
	SEARCH_TTL_MS,
	inferWorkplace,
	parseRelativeDate,
	type SearchProvider,
	type SearchQuery,
} from './common'
import { classifyHeading, emptyHighlights } from './html'

// One entry of `jobs_results` from SerpApi's `google_jobs` engine
export interface RawGoogleJob {
	job_id?: string
	title?: string
	company_name?: string
	location?: string
	via?: string
	description?: string
	thumbnail?: string
	job_highlights?: { title?: string; items?: string[] }[]
	detected_extensions?: {
		posted_at?: string
		schedule_type?: string
		salary?: string
		work_from_home?: boolean
	}
	apply_options?: { title?: string; link?: string }[]
}

interface GoogleJobsResponse {
	jobs_results?: RawGoogleJob[]
	serpapi_pagination?: { next_page_token?: string }
	error?: string
}

// Returns null for results missing the fields the app cannot work without
export function normalizeGoogleJob(raw: RawGoogleJob): JobPosting | null {
	if (!raw.job_id || !raw.title || !raw.company_name) return null

	const highlights = emptyHighlights()
	for (const group of raw.job_highlights ?? []) {
		const kind = classifyHeading(group.title ?? '')
		if (kind) highlights[kind].push(...(group.items ?? []))
	}

	const extensions = raw.detected_extensions
	const location = raw.location?.trim() || undefined
	return {
		id: `serpapi:${raw.job_id}`,
		provider: 'serpapi',
		title: raw.title,
		company: raw.company_name,
		location,
		workplace: extensions?.work_from_home ? 'remote' : inferWorkplace(location),
		description: raw.description ?? '',
		highlights,
		employmentType: extensions?.schedule_type,
		salary: extensions?.salary,
		postedAt: parseRelativeDate(extensions?.posted_at),
		source: raw.via?.replace(/^via\s+/i, ''),
		companyLogoUrl: raw.thumbnail,
		applyLinks: (raw.apply_options ?? []).flatMap((option) =>
			option.link ? [{ label: option.title ?? 'Apply', url: option.link }] : [],
		),
	}
}

// 10 results per call; each call uses one search from the SerpApi quota
export const serpapi: SearchProvider = {
	name: 'serpapi',
	isConfigured: () => !!process.env.SERPAPI_KEY,
	async search(query: SearchQuery) {
		const params = new URLSearchParams({ engine: 'google_jobs', q: query.q })
		if (query.location) params.set('location', query.location)
		// `ltype` is deprecated; remote is expressed in the query text instead
		if (query.remoteOnly) params.set('q', `${query.q} remote`)
		if (query.page) params.set('next_page_token', query.page)

		const key = `serpapi?${params}`
		params.set('api_key', process.env.SERPAPI_KEY ?? '')
		const body = await fetchJsonCached<GoogleJobsResponse>(
			`https://serpapi.com/search.json?${params}`,
			{ ttlMs: SEARCH_TTL_MS, key },
		)
		if (body.error) throw new Error(`SerpApi: ${body.error}`)

		return {
			jobs: (body.jobs_results ?? []).flatMap((raw) => normalizeGoogleJob(raw) ?? []),
			nextPage: body.serpapi_pagination?.next_page_token,
		}
	},
}
