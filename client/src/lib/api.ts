import type { RecommendationsRequest, RecommendationsResponse } from '@/types'

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
