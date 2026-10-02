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

	// Skills the user has already, compared ignoring case ("vue" is the same skill as "Vue")
	function hasSkill(skill: string) {
		const wanted = skill.trim().toLowerCase()
		return !!current.value?.skills.some((existing) => existing.toLowerCase() === wanted)
	}

	// Adds a skill to the saved resume's skills. False if there is no resume or the skill is already on it.
	function addSkill(skill: string) {
		const name = skill.trim()
		if (resume.value.status !== 'ready' || !name || hasSkill(name)) return false
		resume.value.data.skills.push(name)
		return true
	}

	// Takes a skill off the saved resume (the undo of addSkill). False if it was not on it.
	function removeSkill(skill: string) {
		if (resume.value.status !== 'ready') return false
		const wanted = skill.trim().toLowerCase()
		const skills = resume.value.data.skills
		const index = skills.findIndex((existing) => existing.toLowerCase() === wanted)
		if (index === -1) return false
		skills.splice(index, 1)
		return true
	}

	function setError(error: string) {
		resume.value = { status: 'error', error }
	}

	function clear() {
		resume.value = { status: 'idle' }
	}

	persist(STORAGE_KEY, current)

	return { resume, current, hasSkill, addSkill, removeSkill, setLoading, setResume, setError, clear }
})
