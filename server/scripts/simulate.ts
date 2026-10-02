// Offline evaluation of the ranking model: simulated users with hidden preferences swipe through
// their deck round by round, and we measure how many recommended cards they like, with learning
// from swipes on vs off. Run: npm run simulate
import type { JobPosting, RecommendationsRequest, Swipe } from '../../shared/types'
import { getPool } from '../src/pool'
import { indexInBackground } from '../src/rank/embeddings'
import { recommend } from '../src/rank/recommend'
import { jobSkills } from '../src/rank/skills'

const ROUNDS = 6
const CARDS_PER_ROUND = 10

interface Persona {
	name: string
	request: RecommendationsRequest
	// The user's real taste, which the model never sees directly
	likes: (job: JobPosting) => boolean
}

const hasAny = (job: JobPosting, skills: string[]) => jobSkills(job).some((s) => skills.includes(s))

const PERSONAS: Persona[] = [
	{
		// The resume lists both frontend and data skills, but this user only wants frontend work
		name: 'Frontend-leaning intern (Provo)',
		request: {
			profile: {
				titles: ['Software Engineer Intern'],
				keywords: ['JavaScript', 'Python', 'SQL'],
				location: 'Provo, UT',
				seniority: 'intern',
			},
			skills: ['JavaScript', 'TypeScript', 'Vue', 'React', 'HTML', 'CSS', 'Python', 'SQL'],
		},
		likes: (job) =>
			hasAny(job, ['React', 'Vue', 'TypeScript', 'CSS', 'Next.js']) &&
			!/backend|data|infra|security|platform|machine learning|ml\b/i.test(job.title),
	},
	{
		// A generalist resume, but this user is drawn to data and ML roles
		name: 'Data-curious new grad (Salt Lake City)',
		request: {
			profile: {
				titles: ['Software Engineer', 'Data Analyst'],
				keywords: ['Python', 'SQL', 'Java'],
				location: 'Salt Lake City, UT',
				seniority: 'entry',
			},
			skills: ['Python', 'SQL', 'Java', 'Pandas', 'Excel', 'JavaScript', 'Git'],
		},
		likes: (job) =>
			/data|analytics|machine learning|\bml\b|\bai\b|scientist/i.test(job.title) ||
			hasAny(job, ['Machine Learning', 'PyTorch', 'Spark', 'Statistics']),
	},
	{
		// Wants remote roles only, regardless of stack
		name: 'Remote-only backend dev',
		request: {
			profile: {
				titles: ['Backend Engineer', 'Software Engineer'],
				keywords: ['Go', 'Python', 'PostgreSQL'],
				location: 'Provo, UT',
				seniority: 'mid',
			},
			skills: ['Go', 'Python', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'Redis'],
		},
		likes: (job) =>
			job.workplace === 'remote' && hasAny(job, ['Go', 'Python', 'PostgreSQL', 'Kafka']),
	},
]

async function runSession(persona: Persona, learn: boolean) {
	const swipes: Swipe[] = []
	const likeRates: number[] = []
	let taste = { likes: [] as string[], dislikes: [] as string[] }
	for (let round = 0; round < ROUNDS; round++) {
		const response = await recommend(
			{ ...persona.request, swipes, limit: CARDS_PER_ROUND },
			{ learn },
		)
		let liked = 0
		for (const { job } of response.recommendations) {
			const like = persona.likes(job)
			if (like) liked++
			swipes.push({
				jobId: job.id,
				direction: like ? 'like' : 'pass',
				swipedAt: new Date().toISOString(),
			})
		}
		likeRates.push(liked / Math.max(1, response.recommendations.length))
		taste = response.taste
	}
	return { likeRates, taste }
}

const pct = (rate: number) => `${Math.round(rate * 100)}%`.padStart(4)
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length

await indexInBackground(await getPool())
console.log(`\n${ROUNDS} rounds × ${CARDS_PER_ROUND} cards; % of cards the simulated user liked\n`)

for (const persona of PERSONAS) {
	const baseline = await runSession(persona, false)
	const learning = await runSession(persona, true)
	console.log(persona.name)
	console.log(
		`  round:            ${Array.from({ length: ROUNDS }, (_, i) => `${i + 1}`.padStart(4)).join('')}`,
	)
	console.log(
		`  no learning:      ${baseline.likeRates.map(pct).join('')}   mean ${pct(mean(baseline.likeRates))}`,
	)
	console.log(
		`  learning (model): ${learning.likeRates.map(pct).join('')}   mean ${pct(mean(learning.likeRates))}`,
	)
	console.log(`  learned likes:    ${learning.taste.likes.join(', ') || '-'}`)
	console.log(`  learned dislikes: ${learning.taste.dislikes.join(', ') || '-'}\n`)
}
