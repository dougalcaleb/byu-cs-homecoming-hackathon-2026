import type {
	HistoryEntry,
	HistoryResponse,
	JobPosting,
	RecommendationsRequest,
	RecommendationsResponse,
	RecordHistoryRequest,
} from '@/types'

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

/** Save a swipe to the user's history (the server keeps the latest swipe per job). */
export async function recordHistory(user: string, entry: HistoryEntry): Promise<void> {
	const body: RecordHistoryRequest = { user, entry }
	const response = await fetch('/api/history', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})
	if (!response.ok) throw new Error(`Saving history failed (${response.status})`)
}

/** The user's swipe history, newest first. */
export async function fetchHistory(user: string): Promise<HistoryEntry[]> {
	const response = await fetch(`/api/history?user=${encodeURIComponent(user)}`)
	if (!response.ok) throw new Error(`Loading history failed (${response.status})`)
	return ((await response.json()) as HistoryResponse).entries
}
