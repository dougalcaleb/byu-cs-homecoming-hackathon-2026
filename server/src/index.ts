import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import type { CandidatesRequest, CandidatesResponse } from '../../shared/types'
import { BOARDS } from './boards'
import { findCandidates } from './candidates'
import { getPool } from './pool'
import { activeSearchProvider } from './providers'

try {
	process.loadEnvFile()
} catch {
	// No .env; search APIs stay disabled and only the free job boards are used
}

const app = new Hono()

app.get('/api/health', (c) =>
	c.json({ ok: true, searchProvider: activeSearchProvider()?.name ?? null }),
)

// Debug view of what the pool holds
app.get('/api/jobs/pool', async (c) => {
	const pool = await getPool()
	const byCompany: Record<string, number> = {}
	for (const job of pool) byCompany[job.company] = (byCompany[job.company] ?? 0) + 1
	return c.json({ total: pool.length, boards: BOARDS.length, byCompany })
})

app.post('/api/jobs/candidates', async (c) => {
	const body = await c.req.json<CandidatesRequest>().catch(() => null)
	if (
		!body?.profile ||
		!Array.isArray(body.profile.titles) ||
		!Array.isArray(body.profile.keywords)
	) {
		return c.json(
			{ error: 'Expected { profile: { titles: string[], keywords: string[] } }' },
			400,
		)
	}
	return c.json({ jobs: await findCandidates(body) } satisfies CandidatesResponse)
})

// Warm the pool so the first request does not wait on ~50 board fetches
void getPool()

const port = Number(process.env.PORT ?? 8787)
serve({ fetch: app.fetch, port }, () => console.log(`Server on http://localhost:${port}`))
