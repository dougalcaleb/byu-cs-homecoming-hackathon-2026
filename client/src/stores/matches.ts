import { ref } from 'vue'
import { defineStore } from 'pinia'
import { loadStored, persist } from '@/lib/storage'
import type { AsyncState, MatchAnalysis } from '@/types'

const STORAGE_KEY = 'gig-glide:matches'

export const useMatchesStore = defineStore('matches', () => {
	// Keyed by job id; only finished analyses are restored from storage
	const analyses = ref<Record<string, AsyncState<MatchAnalysis>>>({})
	for (const analysis of Object.values(
		loadStored<Record<string, MatchAnalysis>>(STORAGE_KEY) ?? {},
	)) {
		analyses.value[analysis.jobId] = { status: 'ready', data: analysis }
	}

	function analysisFor(jobId: string): AsyncState<MatchAnalysis> {
		return analyses.value[jobId] ?? { status: 'idle' }
	}

	function setLoading(jobId: string) {
		analyses.value[jobId] = { status: 'loading' }
	}

	function setAnalysis(data: MatchAnalysis) {
		analyses.value[data.jobId] = { status: 'ready', data }
	}

	function setError(jobId: string, error: string) {
		analyses.value[jobId] = { status: 'error', error }
	}

	// Analyses are tied to one resume, so drop them when the resume changes
	function clear() {
		analyses.value = {}
	}

	persist(STORAGE_KEY, () => {
		const ready: Record<string, MatchAnalysis> = {}
		for (const [jobId, state] of Object.entries(analyses.value)) {
			if (state.status === 'ready') ready[jobId] = state.data
		}
		return ready
	})

	return { analyses, analysisFor, setLoading, setAnalysis, setError, clear }
})
