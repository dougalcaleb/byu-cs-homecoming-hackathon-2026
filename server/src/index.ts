import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import type {
	HistoryEntry,
	HistoryResponse,
	RecommendationsRequest,
	RecordAppliedRequest,
	RecordHistoryRequest,
} from '../../shared/types'
import { BOARDS } from './boards'
import { jobsById } from './candidates'
import { listHistory, recordSwipe, setApplied } from './history'
import { getPool } from './pool'
import { activeSearchProvider } from './providers'
import { indexInBackground, indexStatus } from './rank/embeddings'
import { recommend } from './rank/recommend'

try {
	process.loadEnvFile()
} catch {
	// No .env; search APIs stay disabled and only the free job boards are used
}

const app = new Hono()

app.get('/api/health', async (c) =>
	c.json({
		ok: true,
		searchProvider: activeSearchProvider()?.name ?? null,
		embeddings: indexStatus(await getPool()),
	}),
)

// Debug view of what the pool holds
app.get('/api/jobs/pool', async (c) => {
	const pool = await getPool()
	const byCompany: Record<string, number> = {}
	for (const job of pool) byCompany[job.company] = (byCompany[job.company] ?? 0) + 1
	return c.json({ total: pool.length, boards: BOARDS.length, byCompany })
})

// One posting by id, so a link to a job can be opened by someone who has never seen it in their deck
app.get('/api/jobs/:id', async (c) => {
	const job = (await jobsById()).get(c.req.param('id'))
	return job ? c.json(job) : c.json({ error: 'Job not found' }, 404)
})

// Swipe history (SQLite). One row per user and job; the latest swipe wins.
app.get('/api/history', (c) => {
	const user = c.req.query('user')
	if (!user) return c.json({ error: 'Expected ?user=<email>' }, 400)
	return c.json<HistoryResponse>({ entries: listHistory(user) })
})

const isValidEntry = (entry: HistoryEntry | undefined): entry is HistoryEntry =>
	!!entry?.jobId &&
	!!entry.company &&
	!!entry.title &&
	(entry.direction === 'like' || entry.direction === 'pass') &&
	!Number.isNaN(Date.parse(entry.swipedAt))

const ENTRY_SHAPE = '{ jobId, company, title, direction: "like" | "pass", swipedAt: ISO date }'

app.post('/api/history', async (c) => {
	const body = await c.req.json<RecordHistoryRequest>().catch(() => null)
	if (!body?.user || !isValidEntry(body.entry)) {
		return c.json({ error: `Expected { user, entry: ${ENTRY_SHAPE} }` }, 400)
	}
	recordSwipe(body.user, body.entry)
	return c.json({ ok: true })
})

// "Did you apply?" answers. appliedAt: ISO date, or null to take the mark back.
app.put('/api/history/applied', async (c) => {
	const body = await c.req.json<RecordAppliedRequest>().catch(() => null)
	const validTime = body?.appliedAt === null || !Number.isNaN(Date.parse(body?.appliedAt ?? ''))
	if (!body?.user || !isValidEntry(body.entry) || !validTime) {
		return c.json({ error: `Expected { user, entry: ${ENTRY_SHAPE}, appliedAt: ISO date | null }` }, 400)
	}
	setApplied(body.user, body.entry, body.appliedAt)
	return c.json({ ok: true })
})

app.post('/api/jobs/recommendations', async (c) => {
	const body = await c.req.json<RecommendationsRequest>().catch(() => null)
	if (
		!body?.profile ||
		!Array.isArray(body.profile.titles) ||
		!Array.isArray(body.profile.keywords) ||
		!Array.isArray(body.skills)
	) {
		return c.json(
			{
				error: 'Expected { profile: { titles: string[], keywords: string[] }, skills: string[] }',
			},
			400,
		)
	}
	// Picks up postings added by a pool refresh
	void getPool().then(indexInBackground)
	return c.json(await recommend(body))
})

// Warm the pool and the embedding index so the first request does not wait on them
void getPool().then(indexInBackground)

const port = Number(process.env.PORT ?? 8787)
// overrideGlobalObjects: Hono otherwise replaces global Request/Response with its own classes,
// which breaks `instanceof Response` checks in other libraries. transformers.js then silently
// skips caching the downloaded model and fails with "Unable to get model file path or buffer".
serve({ fetch: app.fetch, port, overrideGlobalObjects: false }, () =>
	console.log(`Server on http://localhost:${port}`),
)
