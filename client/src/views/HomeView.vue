<template>
	<!-- Fills the remaining page height; the image is absolutely positioned so it crops to fit -->
	<section v-if="job" class="relative flex-1 overflow-hidden">
		<img src="/handsome.png" :alt="`${job.company} cover image`"
			class="absolute inset-0 size-full object-cover object-top" />

		<div class="absolute inset-x-0 top-0 bg-linear-to-b from-black to-transparent px-4 pt-4 pb-12">
			<h1 class="text-3xl font-semibold drop-shadow-xl">{{ job.company }}</h1>
			<p class="text-sm text-neutral-200 drop-shadow">Hiring: {{ job.title }}</p>
			<p v-if="match !== null" class="text-sm font-medium text-accent-soft drop-shadow">Match {{ match }}%</p>
		</div>

		<div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black to-transparent px-4 pt-10 pb-4">
			<TechStackList :items="techStack" />
		</div>
	</section>

	<p v-else class="m-auto text-sm text-muted">No more jobs to show.</p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TechStackList from '@/components/TechStackList.vue'
import { extractTechStack } from '@/lib/techStack'
import { mockJobs, mockMatches } from '@/mocks'
import { useJobsStore } from '@/stores/jobs'
import { useMatchesStore } from '@/stores/matches'

const jobsStore = useJobsStore()
const matchesStore = useMatchesStore()

// Temporary: seed fake data until the job fetch and analysis features are wired up
if (jobsStore.jobs.status === 'idle') jobsStore.setJobs(mockJobs)
for (const analysis of mockMatches) {
	if (matchesStore.analysisFor(analysis.jobId).status === 'idle') matchesStore.setAnalysis(analysis)
}

// The job currently on screen: the first one not yet swiped
const job = computed(() => jobsStore.deck[0])

const match = computed(() => {
	if (!job.value) return null
	const state = matchesStore.analysisFor(job.value.id)
	return state.status === 'ready' ? state.data.score : null
})

const techStack = computed(() => (job.value ? extractTechStack(job.value) : []))
</script>
