import type { JobPosting, JobProvider, RemotePreference } from '../../../shared/types'

const HOUR = 3_600_000
export const BOARD_TTL_MS = 6 * HOUR
export const SEARCH_TTL_MS = 24 * HOUR

export type BoardProvider = Extract<JobProvider, 'greenhouse' | 'lever' | 'ashby'>

// One company's public job board on an ATS; `token` is the slug in the board URL
export interface Board {
	provider: BoardProvider
	token: string
	company: string
}

export interface SearchQuery {
	q: string
	location?: string
	remoteOnly?: boolean
	// Opaque token from a previous SearchResult
	page?: string
}

export interface SearchResult {
	jobs: JobPosting[]
	nextPage?: string
}

// A paid/quota-limited API that searches across many companies
export interface SearchProvider {
	name: JobProvider
	isConfigured(): boolean
	search(query: SearchQuery): Promise<SearchResult>
}

export function inferWorkplace(...hints: (string | undefined)[]): RemotePreference | undefined {
	const text = hints.filter(Boolean).join(' ').toLowerCase()
	if (/hybrid/.test(text)) return 'hybrid'
	if (/remote|work from home|anywhere/.test(text)) return 'remote'
	if (/on-?site|in[- ]office/.test(text)) return 'onsite'
	return undefined
}

export function inferEmploymentType(title: string): string | undefined {
	if (/\bintern(ship)?\b|\bco-?op\b/i.test(title)) return 'Internship'
	if (/\bpart[- ]time\b/i.test(title)) return 'Part-time'
	if (/\bcontract(or)?\b/i.test(title)) return 'Contract'
	return undefined
}

// formatSalary(90000, 120000, 'USD', 'year') → "$90K–$120K a year"
export function formatSalary(
	min: number | null | undefined,
	max: number | null | undefined,
	currency = 'USD',
	period?: string,
): string | undefined {
	if (!min && !max) return undefined
	const symbol = currency === 'USD' ? '$' : `${currency} `
	const amount = (value: number) =>
		value >= 1000 ? `${symbol}${Math.round(value / 100) / 10}K` : `${symbol}${value}`
	const range =
		min && max && min !== max ? `${amount(min)}–${amount(max)}` : amount((min || max)!)
	const unit = period
		?.toLowerCase()
		.replace(/^per\s+/, '')
		.replace(/^1\s+/, '')
	return unit ? `${range} a ${unit}` : range
}

// "3 days ago" / "21 hours ago" / "30+ days ago" → approximate ISO date
export function parseRelativeDate(text: string | undefined, now = Date.now()): string | undefined {
	const match = text?.match(/(\d+)\+?\s*(minute|hour|day|week|month|year)s?\s+ago/i)
	if (!match) return undefined
	const unitMs: Record<string, number> = {
		minute: 60_000,
		hour: HOUR,
		day: 24 * HOUR,
		week: 7 * 24 * HOUR,
		month: 30 * 24 * HOUR,
		year: 365 * 24 * HOUR,
	}
	const ms = Number(match[1]) * (unitMs[match[2]!.toLowerCase()] ?? 0)
	return new Date(now - ms).toISOString()
}

export function toIso(value: string | number | undefined): string | undefined {
	if (value === undefined) return undefined
	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}
