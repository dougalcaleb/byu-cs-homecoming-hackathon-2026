import type { JobHighlights, JobPosting } from '@/types'

// One entry of `jobs_results` from a Google Jobs search (SerpApi `google_jobs` shape).
// If the team uses a different provider, only this file needs to change.
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

function normalizeHighlights(raw: RawGoogleJob['job_highlights']): JobHighlights {
	const highlights: JobHighlights = { qualifications: [], responsibilities: [], benefits: [] }
	for (const group of raw ?? []) {
		const title = group.title?.toLowerCase() ?? ''
		const items = group.items ?? []
		if (title.includes('qualif')) highlights.qualifications.push(...items)
		else if (title.includes('responsib')) highlights.responsibilities.push(...items)
		else if (title.includes('benefit')) highlights.benefits.push(...items)
	}
	return highlights
}

// Returns null for results missing the fields the app cannot work without
export function normalizeJob(raw: RawGoogleJob): JobPosting | null {
	if (!raw.job_id || !raw.title || !raw.company_name) return null

	const extensions = raw.detected_extensions
	return {
		id: raw.job_id,
		title: raw.title,
		company: raw.company_name,
		location: raw.location?.trim() || undefined,
		isRemote: extensions?.work_from_home,
		description: raw.description ?? '',
		highlights: normalizeHighlights(raw.job_highlights),
		employmentType: extensions?.schedule_type,
		salary: extensions?.salary,
		postedAt: extensions?.posted_at,
		source: raw.via?.replace(/^via\s+/i, ''),
		companyLogoUrl: raw.thumbnail,
		applyLinks: (raw.apply_options ?? []).flatMap((option) =>
			option.link ? [{ label: option.title ?? 'Apply', url: option.link }] : [],
		),
	}
}

export function normalizeJobs(raw: RawGoogleJob[]): JobPosting[] {
	const seen = new Set<string>()
	return raw.flatMap((entry) => {
		const job = normalizeJob(entry)
		if (!job || seen.has(job.id)) return []
		seen.add(job.id)
		return [job]
	})
}
