import type { JobPosting } from '../../../shared/types'
import { fetchJsonCached } from '../cache'
import { BOARD_TTL_MS, inferWorkplace, toIso, type Board } from './common'
import { extractHighlights, htmlToText } from './html'

// GET https://api.ashbyhq.com/posting-api/job-board/{token}?includeCompensation=true
export interface RawAshbyJob {
	id: string
	title: string
	department?: string
	team?: string
	employmentType?: 'FullTime' | 'PartTime' | 'Intern' | 'Contract' | 'Temporary'
	location?: string
	secondaryLocations?: { location: string }[]
	publishedAt?: string
	isListed?: boolean
	isRemote?: boolean
	workplaceType?: 'Remote' | 'Hybrid' | 'OnSite'
	jobUrl: string
	applyUrl?: string
	descriptionHtml?: string
	compensation?: {
		scrapeableCompensationSalarySummary?: string
		compensationTierSummary?: string
	}
}

const EMPLOYMENT_TYPES: Record<string, string> = {
	FullTime: 'Full-time',
	PartTime: 'Part-time',
	Intern: 'Internship',
	Contract: 'Contract',
	Temporary: 'Temporary',
}

const MAX_LOCATIONS = 3

export function normalizeAshbyJob(raw: RawAshbyJob, board: Board): JobPosting {
	const html = raw.descriptionHtml ?? ''
	const locations = [raw.location, ...(raw.secondaryLocations ?? []).map((l) => l.location)]
		.filter((l): l is string => !!l)
		.slice(0, MAX_LOCATIONS)
	return {
		id: `ashby:${board.token}:${raw.id}`,
		provider: 'ashby',
		title: raw.title.trim(),
		company: board.company,
		location: locations.join('; ') || undefined,
		workplace:
			inferWorkplace(raw.workplaceType) ??
			(raw.isRemote ? 'remote' : inferWorkplace(...locations)),
		department: raw.department ?? raw.team,
		description: htmlToText(html),
		highlights: extractHighlights(html),
		employmentType: raw.employmentType && EMPLOYMENT_TYPES[raw.employmentType],
		salary:
			raw.compensation?.scrapeableCompensationSalarySummary ??
			raw.compensation?.compensationTierSummary,
		postedAt: toIso(raw.publishedAt),
		applyLinks: [{ label: board.company, url: raw.applyUrl ?? raw.jobUrl }],
	}
}

export async function fetchAshbyBoard(board: Board): Promise<JobPosting[]> {
	const url = `https://api.ashbyhq.com/posting-api/job-board/${board.token}?includeCompensation=true`
	const body = await fetchJsonCached<{ jobs?: RawAshbyJob[] }>(url, { ttlMs: BOARD_TTL_MS })
	return (body.jobs ?? [])
		.filter((job) => job.isListed !== false)
		.map((job) => normalizeAshbyJob(job, board))
}
