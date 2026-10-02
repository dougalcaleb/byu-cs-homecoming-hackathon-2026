import type { JobPosting } from '../../shared/types'
import { BOARDS } from './boards'
import { fetchBoard } from './providers'
import { BOARD_TTL_MS } from './providers/common'

const CONCURRENCY = 8

let pool: JobPosting[] = []
let loadedAt = 0
let loading: Promise<JobPosting[]> | null = null

// Every job from every board in BOARDS, refreshed when the board cache expires.
// Thousands of jobs; callers filter it down rather than sending it to the client.
export function getPool(): Promise<JobPosting[]> {
	if (loading) return loading
	if (loadedAt && Date.now() - loadedAt < BOARD_TTL_MS) return Promise.resolve(pool)
	loading = load().finally(() => (loading = null))
	return loading
}

async function load() {
	const started = Date.now()
	const results = await mapLimit(BOARDS, CONCURRENCY, async (board) => {
		try {
			return await fetchBoard(board)
		} catch (error) {
			// One broken board should not take down the pool
			console.warn(
				`[pool] ${board.provider}/${board.token} failed:`,
				(error as Error).message,
			)
			return []
		}
	})

	const seen = new Set<string>()
	pool = results.flat().filter((job) => !seen.has(job.id) && !!seen.add(job.id))
	loadedAt = Date.now()
	console.log(
		`[pool] ${pool.length} jobs from ${BOARDS.length} boards in ${loadedAt - started}ms`,
	)
	return pool
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
	const results: R[] = new Array(items.length)
	let next = 0
	const worker = async () => {
		while (next < items.length) {
			const index = next++
			results[index] = await fn(items[index]!)
		}
	}
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
	return results
}
