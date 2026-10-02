import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { loadStored, persist } from '@/lib/storage'
import type { AsyncState, JobPosting, Recommendation, Swipe, SwipeDirection } from '@/types'

// Bump the version when the saved jobs should be discarded (e.g. the mock postings change)
const JOBS_KEY = 'gig-glide:jobs:v5'
const RECS_KEY = 'gig-glide:recommendations:v1'
const SWIPES_KEY = 'gig-glide:swipes'

export const useJobsStore = defineStore('jobs', () => {
	const stored = loadStored<JobPosting[]>(JOBS_KEY)
	const jobs = ref<AsyncState<JobPosting[]>>(
		stored ? { status: 'ready', data: stored } : { status: 'idle' },
	)
	const swipes = ref<Record<string, Swipe>>(loadStored(SWIPES_KEY) ?? {})
	// What the ranking API said about each job (score, matched/missing skills, reasons), keyed by job id
	const recommendations = ref<Record<string, Recommendation>>(loadStored(RECS_KEY) ?? {})

	const all = computed(() => (jobs.value.status === 'ready' ? jobs.value.data : []))
	// Jobs the user has not swiped on yet
	const deck = computed(() => all.value.filter((job) => !swipes.value[job.id]))
	const liked = computed(() =>
		all.value.filter((job) => swipes.value[job.id]?.direction === 'like'),
	)

	function jobById(id: string) {
		return all.value.find((job) => job.id === id)
	}

	function setLoading() {
		jobs.value = { status: 'loading' }
	}

	function setJobs(data: JobPosting[]) {
		const seen = new Set<string>()
		const unique = data.filter((job) => !seen.has(job.id) && seen.add(job.id))
		jobs.value = { status: 'ready', data: unique }
	}

	// Adds a batch from the recommendations API to the queue; jobs already in the store are kept as they are
	function addRecommendations(batch: Recommendation[]) {
		const known = new Set(all.value.map((job) => job.id))
		const fresh = batch.filter((recommendation) => !known.has(recommendation.job.id))
		for (const recommendation of batch) recommendations.value[recommendation.job.id] = recommendation
		jobs.value = { status: 'ready', data: [...all.value, ...fresh.map((recommendation) => recommendation.job)] }
		return fresh.length
	}

	// Makes a job the next one in the deck (e.g. when opening a link to it), un-swiping it if needed
	function bringToFront(job: JobPosting) {
		delete swipes.value[job.id]
		jobs.value = { status: 'ready', data: [job, ...all.value.filter((queued) => queued.id !== job.id)] }
	}

	function setError(error: string) {
		jobs.value = { status: 'error', error }
	}

	function swipe(jobId: string, direction: SwipeDirection) {
		swipes.value[jobId] = { jobId, direction, swipedAt: new Date().toISOString() }
	}

	function undoSwipe(jobId: string) {
		delete swipes.value[jobId]
	}

	function clear() {
		jobs.value = { status: 'idle' }
		swipes.value = {}
		recommendations.value = {}
	}

	persist(JOBS_KEY, () => (jobs.value.status === 'ready' ? jobs.value.data : null))
	persist(SWIPES_KEY, swipes)
	persist(RECS_KEY, recommendations)

	return {
		jobs,
		swipes,
		recommendations,
		all,
		deck,
		liked,
		jobById,
		setLoading,
		setJobs,
		addRecommendations,
		bringToFront,
		setError,
		swipe,
		undoSwipe,
		clear,
	}
})
