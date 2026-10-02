import type { JobPosting, SearchProfile } from '../../../shared/types'
import type { Place } from '../location'
import { dot, jobVector } from './embeddings'
import { daysSincePosted, isReachable, seniorityFit, titleMatch } from './signals'
import { jobSkills } from './skills'

export interface UserContext {
	profile: SearchProfile
	// Canonical skill names from the resume
	skills: Set<string>
	place?: Place
	resumeVector?: Float32Array
	// Taste vectors: mean embedding of liked / passed jobs so far
	likedCentroid?: Float32Array
	passedCentroid?: Float32Array
}

// Sparse feature vector. Dense features have fixed names; `skill:*` and `workplace:*` are
// one-hot style features whose weights are learned purely from swipes.
export type Features = Map<string, number>

// Cosine similarities between MiniLM vectors mostly fall in 0.1–0.6; spread that over 0–1
function rescale(similarity: number) {
	return Math.min(1, Math.max(0, (similarity - 0.1) / 0.5))
}

export function featurize(job: JobPosting, user: UserContext, now = Date.now()): Features {
	const features: Features = new Map([['bias', 1]])
	const vector = jobVector(job)

	if (vector && user.resumeVector)
		features.set('semantic', rescale(dot(vector, user.resumeVector)))

	const skills = jobSkills(job)
	const matched = skills.filter((skill) => user.skills.has(skill)).length
	features.set('skillCoverage', skills.length ? matched / skills.length : 0.3)
	features.set('skillHits', Math.min(matched, 5) / 5)

	features.set('title', titleMatch(job, user.profile.titles))
	features.set('seniority', seniorityFit(job, user.profile.seniority))
	features.set('reachable', user.place ? (isReachable(job, user.place) ? 1 : 0) : 0.5)

	const days = daysSincePosted(job, now)
	features.set('recency', days === undefined ? 0.3 : Math.exp(-days / 30))

	if (vector && user.likedCentroid)
		features.set('likedSim', rescale(dot(vector, user.likedCentroid)))
	if (vector && user.passedCentroid) {
		features.set('passedSim', rescale(dot(vector, user.passedCentroid)))
	}

	// Scaled so postings that list many skills do not dominate the learned skill weights
	const perSkill = skills.length ? 1 / Math.sqrt(skills.length) : 0
	for (const skill of skills) features.set(`skill:${skill}`, perSkill)
	if (job.workplace) features.set(`workplace:${job.workplace}`, 1)

	return features
}
