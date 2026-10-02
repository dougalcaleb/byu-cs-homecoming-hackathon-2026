import type {
	JobPosting,
	Recommendation,
	RecommendationsRequest,
	RecommendationsResponse,
	TasteSummary,
} from '../../../shared/types'
import { dedupe, jobsById, retrieve } from '../candidates'
import { parsePlace } from '../location'
import { centroid, dot, embed, ensureJobVectors, jobVector } from './embeddings'
import { featurize, type Features, type UserContext } from './features'
import { SwipeModel } from './model'
import { daysSincePosted, jobSeniority } from './signals'
import { jobSkills, normalizeSkills, toSkillTags } from './skills'

const DEFAULT_LIMIT = 30
const MAX_LIMIT = 100
// Maximal marginal relevance: 1 = pure score order, lower = more variety between cards
const MMR_LAMBDA = 0.75
const SAME_COMPANY_PENALTY = 0.08
const MAX_REASONS = 3

interface Scored {
	job: JobPosting
	features: Features
	probability: number
}

export interface RecommendOptions {
	// false = swipes only exclude jobs and the prior weights are used as-is (evaluation baseline)
	learn?: boolean
}

export async function recommend(
	request: RecommendationsRequest,
	{ learn = true }: RecommendOptions = {},
): Promise<RecommendationsResponse> {
	const { profile } = request
	const limit = Math.min(request.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
	const swipes = request.swipes ?? []

	const user: UserContext = {
		profile,
		skills: new Set(normalizeSkills([...request.skills, ...profile.keywords])),
		place: profile.location ? parsePlace(profile.location) : undefined,
		resumeVector: await resumeVector(request),
	}

	// 1. Train: replay the swipe history in order. Each swipe is featurized with the taste
	//    vectors as they were at that moment, exactly as the model would have seen it live.
	const jobs = await jobsById()
	const swiped = swipes.flatMap((swipe) => {
		const job = jobs.get(swipe.jobId)
		return job ? [{ job, liked: swipe.direction === 'like' }] : []
	})
	await ensureJobVectors(swiped.map(({ job }) => job))

	const model = new SwipeModel()
	const likedVectors: Float32Array[] = []
	const passedVectors: Float32Array[] = []
	for (const { job, liked } of learn ? swiped : []) {
		user.likedCentroid = centroid(likedVectors)
		user.passedCentroid = centroid(passedVectors)
		model.update(featurize(job, user), liked)
		const vector = jobVector(job)
		if (vector) (liked ? likedVectors : passedVectors).push(vector)
	}
	user.likedCentroid = centroid(likedVectors)
	user.passedCentroid = centroid(passedVectors)

	// 2. Retrieve candidates, then 3. score them
	const candidates = await retrieve(profile, {
		exclude: new Set(swipes.map((swipe) => swipe.jobId)),
		place: user.place,
		resumeVector: user.resumeVector,
	})
	await ensureJobVectors(candidates)

	const now = Date.now()
	const scored = candidates
		.map((job): Scored => {
			const features = featurize(job, user, now)
			return { job, features, probability: model.predict(features) }
		})
		.sort((a, b) => b.probability - a.probability)

	// 4. Order for the deck: one card per role, varied
	const deck = diversify(
		dedupe(scored, (item) => item.job),
		limit,
	)

	return {
		recommendations: deck.map((item) => explain(item, user, model)),
		taste: taste(model),
	}
}

const resumeVectors = new Map<string, Float32Array>()

async function resumeVector(request: RecommendationsRequest) {
	const text = [
		request.profile.titles.join(', '),
		request.skills.join(', '),
		request.resumeText?.slice(0, 1500),
	]
		.filter(Boolean)
		.join('\n')
	if (!text) return undefined
	let vector = resumeVectors.get(text)
	if (!vector) {
		vector = (await embed([text]))[0]!
		resumeVectors.set(text, vector)
	}
	return vector
}

// Greedy maximal marginal relevance: each pick trades predicted appeal against similarity to
// cards already picked, so the deck is not ten near-identical postings.
function diversify(items: Scored[], limit: number) {
	const pool = items.slice(0, limit * 3)
	const picked: Scored[] = []
	const companyCounts = new Map<string, number>()

	while (picked.length < limit && pool.length > 0) {
		let best = 0
		let bestValue = -Infinity
		pool.forEach((item, index) => {
			const vector = jobVector(item.job)
			const redundancy = vector
				? Math.max(
						0,
						...picked.map((p) => {
							const other = jobVector(p.job)
							return other ? dot(vector, other) : 0
						}),
					)
				: 0
			const value =
				MMR_LAMBDA * item.probability -
				(1 - MMR_LAMBDA) * redundancy -
				SAME_COMPANY_PENALTY * (companyCounts.get(item.job.company) ?? 0)
			if (value > bestValue) {
				bestValue = value
				best = index
			}
		})
		const [item] = pool.splice(best, 1)
		picked.push(item!)
		companyCounts.set(item!.job.company, (companyCounts.get(item!.job.company) ?? 0) + 1)
	}
	return picked
}

const LEVEL_LABELS = {
	intern: 'Internship',
	entry: 'Entry level',
	mid: 'Mid level',
	senior: 'Senior',
}

// Turns the features that pushed the score up the most into short reasons for the card
function explain(item: Scored, user: UserContext, model: SwipeModel): Recommendation {
	const { job, features, probability } = item
	const skills = jobSkills(job)
	const matched = skills.filter((skill) => user.skills.has(skill))
	const missing = skills.filter((skill) => !user.skills.has(skill))

	const reasons: string[] = []
	const add = (reason: string) => {
		if (!reasons.includes(reason) && reasons.length < MAX_REASONS) reasons.push(reason)
	}
	for (const { name, contribution } of model.contributions(features)) {
		if (contribution < 0.15) break
		if (name === 'semantic') add('Strong match with your resume')
		else if ((name === 'skillCoverage' || name === 'skillHits') && matched.length) {
			add(`Uses ${matched.slice(0, 3).join(', ')}`)
		} else if (name === 'title') add("Matches the roles you're looking for")
		else if (name === 'seniority') {
			const level = jobSeniority(job)
			if (level) add(`${LEVEL_LABELS[level]}, right for your level`)
		} else if (name === 'reachable') {
			add(job.workplace === 'remote' ? 'Remote' : `In ${job.location?.split(/[;,]/)[0]}`)
		} else if (name === 'recency' && (daysSincePosted(job) ?? Infinity) < 7)
			add('Posted this week')
		else if (name === 'likedSim') add('Similar to jobs you liked')
		else if (name.startsWith('skill:')) add(`You've been liking ${name.slice(6)} roles`)
		else if (name === 'workplace:remote') add('You tend to like remote roles')
	}

	return {
		job,
		score: Math.round(probability * 100),
		matchedSkills: toSkillTags(matched),
		missingSkills: toSkillTags(missing),
		reasons,
	}
}

const TASTE_SIZE = 5
const TASTE_THRESHOLD = 0.1

function taste(model: SwipeModel): TasteSummary {
	const skills = model.learned('skill:')
	return {
		likes: skills
			.filter((s) => s.weight > TASTE_THRESHOLD)
			.slice(0, TASTE_SIZE)
			.map((s) => s.name),
		dislikes: skills
			.filter((s) => s.weight < -TASTE_THRESHOLD)
			.reverse()
			.slice(0, TASTE_SIZE)
			.map((s) => s.name),
		swipeCount: model.swipeCount,
	}
}
