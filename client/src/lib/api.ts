import type { JobPosting, RecommendationsRequest, RecommendationsResponse } from '@/types'

export async function fetchRecommendations(
	request: RecommendationsRequest,
): Promise<RecommendationsResponse> {
	const response = await fetch('/api/jobs/recommendations', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(request),
	})
	if (!response.ok) throw new Error(`Job recommendations failed (${response.status})`)
	return (await response.json()) as RecommendationsResponse
}

/** One posting by id (for links to a job). Null when the server does not know it. */
export async function fetchJob(id: string): Promise<JobPosting | null> {
	const response = await fetch(`/api/jobs/${encodeURIComponent(id)}`)
	if (response.status === 404) return null
	if (!response.ok) throw new Error(`Job lookup failed (${response.status})`)
	return (await response.json()) as JobPosting
}
