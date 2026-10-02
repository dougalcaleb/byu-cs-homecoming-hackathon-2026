import type { CandidatesRequest, CandidatesResponse, JobPosting } from '@/types'

export async function fetchCandidates(request: CandidatesRequest): Promise<JobPosting[]> {
	const response = await fetch('/api/jobs/candidates', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(request),
	})
	if (!response.ok) throw new Error(`Job search failed (${response.status})`)
	return ((await response.json()) as CandidatesResponse).jobs
}
