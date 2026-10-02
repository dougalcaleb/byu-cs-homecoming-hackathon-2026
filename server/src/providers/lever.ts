import type { JobPosting } from '../../../shared/types'
import { fetchJsonCached } from '../cache'
import {
	BOARD_TTL_MS,
	formatSalary,
	inferEmploymentType,
	inferWorkplace,
	toIso,
	type Board,
} from './common'
import { extractHighlights, htmlToText } from './html'

// GET https://api.lever.co/v0/postings/{token}?mode=json
export interface RawLeverJob {
	id: string
	text: string
	categories?: {
		commitment?: string
		department?: string
		team?: string
		location?: string
		allLocations?: string[]
	}
	description?: string
	// Titled bullet sections ("What We Require"); `content` is a run of <li> elements
	lists?: { text: string; content: string }[]
	additional?: string
	hostedUrl: string
	applyUrl?: string
	createdAt?: number
	workplaceType?: string
	salaryRange?: { min?: number; max?: number; currency?: string; interval?: string }
}

export function normalizeLeverJob(raw: RawLeverJob, board: Board): JobPosting {
	const lists = (raw.lists ?? []).map((list) => `<h3>${list.text}</h3><ul>${list.content}</ul>`)
	const html = [raw.description ?? '', ...lists, raw.additional ?? ''].join('\n')
	const location = raw.categories?.allLocations?.join('; ') || raw.categories?.location
	const salary = raw.salaryRange
	return {
		id: `lever:${board.token}:${raw.id}`,
		provider: 'lever',
		title: raw.text.trim(),
		company: board.company,
		location,
		workplace: inferWorkplace(raw.workplaceType, location),
		department: raw.categories?.department ?? raw.categories?.team,
		description: htmlToText(html),
		highlights: extractHighlights(html),
		employmentType:
			inferEmploymentType(raw.categories?.commitment ?? '') ??
			raw.categories?.commitment ??
			inferEmploymentType(raw.text),
		salary: salary && formatSalary(salary.min, salary.max, salary.currency, salary.interval),
		postedAt: toIso(raw.createdAt),
		applyLinks: [{ label: board.company, url: raw.applyUrl ?? raw.hostedUrl }],
	}
}

export async function fetchLeverBoard(board: Board): Promise<JobPosting[]> {
	const url = `https://api.lever.co/v0/postings/${board.token}?mode=json`
	const body = await fetchJsonCached<RawLeverJob[]>(url, { ttlMs: BOARD_TTL_MS })
	return body.map((job) => normalizeLeverJob(job, board))
}
