import type { JobPosting, Seniority } from '../../../shared/types'
import { isNearby, isOpenToUs, type Place } from '../location'

const SENIOR_TITLE = /\b(senior|sr\.?|staff|principal|lead|manager|director|head of|vp|chief)\b/i
const INTERN_TITLE = /\b(intern|internship|co-?op|student)\b/i
const ENTRY_TITLE =
	/\b(junior|jr\.?|new grad|graduate|entry[- ]level|associate|early career|university)\b/i
const MID_TITLE = /\b(mid[- ]level|II|III)\b/

export function jobSeniority(job: JobPosting): Seniority | undefined {
	if (SENIOR_TITLE.test(job.title)) return 'senior'
	if (INTERN_TITLE.test(job.title) || job.employmentType === 'Internship') return 'intern'
	if (ENTRY_TITLE.test(job.title) || /\bI\b/.test(job.title)) return 'entry'
	if (MID_TITLE.test(job.title)) return 'mid'
	return undefined
}

const LEVELS: Seniority[] = ['intern', 'entry', 'mid', 'senior']

// 1 = same level, 0.5 = adjacent, 0 = unknown, -1 = two or more levels apart
export function seniorityFit(job: JobPosting, wanted: Seniority | undefined) {
	const level = jobSeniority(job)
	if (!wanted || !level) return 0
	const distance = Math.abs(LEVELS.indexOf(level) - LEVELS.indexOf(wanted))
	return distance === 0 ? 1 : distance === 1 ? 0.5 : -1
}

// Jobs that should never be shown: a staff role to an intern, or a job only open to people in
// another country (assumes US-based users)
export function isOutOfReach(job: JobPosting, wanted: Seniority | undefined) {
	if ((wanted === 'intern' || wanted === 'entry') && SENIOR_TITLE.test(job.title)) return true
	return !!job.location && !isOpenToUs(job.location)
}

export function words(text: string) {
	return new Set(text.toLowerCase().match(/[a-z0-9+#]+/g) ?? [])
}

// Best fraction of a target title's words that appear in the job title
export function titleMatch(job: JobPosting, titles: string[]) {
	const titleWords = words(job.title)
	return Math.max(
		0,
		...titles.map((title) => {
			const wanted = [...words(title)]
			return wanted.length
				? wanted.filter((w) => titleWords.has(w)).length / wanted.length
				: 0
		}),
	)
}

// Whether the user could take this job: nearby, or remote and open to US workers
export function isReachable(job: JobPosting, place: Place) {
	return job.workplace === 'remote'
		? !job.location || isOpenToUs(job.location)
		: !!job.location && isNearby(place, job.location)
}

export function daysSincePosted(job: JobPosting, now = Date.now()) {
	if (!job.postedAt) return undefined
	return Math.max(0, (now - new Date(job.postedAt).getTime()) / 86_400_000)
}
