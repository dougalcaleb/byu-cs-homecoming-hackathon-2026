import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { loadStored, persist } from '@/lib/storage'
import type { AsyncState, JobPosting, Swipe, SwipeDirection } from '@/types'

// Bump the version when the saved jobs should be discarded (e.g. the mock postings change)
const JOBS_KEY = 'gig-glide:jobs:v4'
const SWIPES_KEY = 'gig-glide:swipes'

export const useJobsStore = defineStore('jobs', () => {
	const stored = loadStored<JobPosting[]>(JOBS_KEY)
	const jobs = ref<AsyncState<JobPosting[]>>(
		stored ? { status: 'ready', data: stored } : { status: 'idle' },
	)
	const swipes = ref<Record<string, Swipe>>(loadStored(SWIPES_KEY) ?? {})

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
	}

	persist(JOBS_KEY, () => (jobs.value.status === 'ready' ? jobs.value.data : null))
	persist(SWIPES_KEY, swipes)

	return {
		jobs,
		swipes,
		all,
		deck,
		liked,
		jobById,
		setLoading,
		setJobs,
		setError,
		swipe,
		undoSwipe,
		clear,
	}
})
