import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { loadStored, persist } from '@/lib/storage'
import type { AsyncState, Resume } from '@/types'

const STORAGE_KEY = 'gig-glide:resume'

export const useResumeStore = defineStore('resume', () => {
	const stored = loadStored<Resume>(STORAGE_KEY)
	const resume = ref<AsyncState<Resume>>(
		stored ? { status: 'ready', data: stored } : { status: 'idle' },
	)

	const current = computed(() => (resume.value.status === 'ready' ? resume.value.data : null))

	function setLoading() {
		resume.value = { status: 'loading' }
	}

	function setResume(data: Resume) {
		resume.value = { status: 'ready', data }
	}

	function setError(error: string) {
		resume.value = { status: 'error', error }
	}

	function clear() {
		resume.value = { status: 'idle' }
	}

	persist(STORAGE_KEY, current)

	return { resume, current, setLoading, setResume, setError, clear }
})
