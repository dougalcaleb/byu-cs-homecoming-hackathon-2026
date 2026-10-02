import type { JobPosting } from '../../../shared/types'
import { fetchJsonCached } from '../cache'
import { BOARD_TTL_MS, inferEmploymentType, inferWorkplace, toIso, type Board } from './common'
import { decodeEntities, extractHighlights, htmlToText } from './html'

// GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true
export interface RawGreenhouseJob {
	id: number
	title: string
	absolute_url: string
	// HTML that is itself entity-escaped ("&lt;p&gt;…")
	content?: string
	location?: { name?: string }
	departments?: { name: string }[]
	first_published?: string
	updated_at?: string
}

export function normalizeGreenhouseJob(raw: RawGreenhouseJob, board: Board): JobPosting {
	const html = decodeEntities(raw.content ?? '')
	const location = raw.location?.name?.trim() || undefined
	return {
		id: `greenhouse:${board.token}:${raw.id}`,
		provider: 'greenhouse',
		title: raw.title.trim(),
		company: board.company,
		location,
		workplace: inferWorkplace(location),
		department: raw.departments?.[0]?.name,
		description: htmlToText(html),
		highlights: extractHighlights(html),
		employmentType: inferEmploymentType(raw.title),
		postedAt: toIso(raw.first_published ?? raw.updated_at),
		applyLinks: [{ label: board.company, url: raw.absolute_url }],
	}
}

export async function fetchGreenhouseBoard(board: Board): Promise<JobPosting[]> {
	const url = `https://boards-api.greenhouse.io/v1/boards/${board.token}/jobs?content=true`
	const body = await fetchJsonCached<{ jobs?: RawGreenhouseJob[] }>(url, { ttlMs: BOARD_TTL_MS })
	return (body.jobs ?? []).map((job) => normalizeGreenhouseJob(job, board))
}
