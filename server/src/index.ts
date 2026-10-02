import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import type { RecommendationsRequest } from '../../shared/types'
import { BOARDS } from './boards'
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
serve({ fetch: app.fetch, port }, () => console.log(`Server on http://localhost:${port}`))
