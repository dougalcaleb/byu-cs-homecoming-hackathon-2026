import type { Features } from './features'

// Starting weights, used before the user has swiped (cold start). Each says how much a feature
// should matter for a typical job seeker. Swipes then move the weights away from these.
export const PRIOR_WEIGHTS: Record<string, number> = {
	bias: -3.5,
	semantic: 2,
	skillCoverage: 1.5,
	skillHits: 0.5,
	title: 1.5,
	seniority: 1,
	reachable: 0.75,
	recency: 0.3,
	likedSim: 2,
	passedSim: -1.5,
}

const LEARNING_RATE = 0.5
// Pull toward the prior weights (L2 regularization centered on the prior, i.e. a Gaussian prior
// in Bayesian terms). Keeps a handful of swipes from overturning sensible defaults.
const PRIOR_STRENGTH = 0.02

function sigmoid(z: number) {
	return 1 / (1 + Math.exp(-z))
}

// Logistic regression predicting P(swipe right | job, user), trained online with SGD.
// One model per request: it is rebuilt by replaying the user's swipe history, so the server
// keeps no per-user state.
export class SwipeModel {
	readonly weights = new Map(Object.entries(PRIOR_WEIGHTS))
	swipeCount = 0

	private logit(features: Features) {
		let z = 0
		for (const [name, value] of features) z += (this.weights.get(name) ?? 0) * value
		return z
	}

	predict(features: Features) {
		return sigmoid(this.logit(features))
	}

	// One SGD step on the log loss for a single swipe
	update(features: Features, liked: boolean) {
		const error = (liked ? 1 : 0) - this.predict(features)
		for (const [name, value] of features) {
			const weight = this.weights.get(name) ?? 0
			const prior = PRIOR_WEIGHTS[name] ?? 0
			this.weights.set(
				name,
				weight + LEARNING_RATE * (error * value - PRIOR_STRENGTH * (weight - prior)),
			)
		}
		this.swipeCount++
	}

	// Each feature's push on the logit, largest first
	contributions(features: Features) {
		return [...features]
			.filter(([name]) => name !== 'bias')
			.map(([name, value]) => ({
				name,
				value,
				contribution: (this.weights.get(name) ?? 0) * value,
			}))
			.sort((a, b) => b.contribution - a.contribution)
	}

	// Learned preferences that differ from the prior, e.g. skill:React +0.8
	learned(prefix: string) {
		return [...this.weights]
			.filter(([name]) => name.startsWith(prefix))
			.map(([name, weight]) => ({ name: name.slice(prefix.length), weight }))
			.sort((a, b) => b.weight - a.weight)
	}
}
