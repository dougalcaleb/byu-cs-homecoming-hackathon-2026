<template>
	<!-- Positioned by the parent (left-0 / left-full) so the same card can sit in the current or the next slot -->
	<div class="absolute inset-y-0 w-full touch-pan-y select-none overflow-hidden border-x border-border bg-surface">
		<JobCardCover :job="job" class="pointer-events-none" />

		<div class="absolute inset-x-0 top-0 bg-linear-to-b from-black to-transparent px-4 pt-4 pb-12">
			<h1 class="text-3xl font-semibold drop-shadow-xl">{{ job.company }}</h1>
			<p class="text-sm text-neutral-200 drop-shadow">{{ job.location }}</p>
			<p v-if="match !== null" class="text-sm font-medium text-accent-soft drop-shadow">Match {{ match }}%</p>
		</div>

		<JobCardFooter :job="job" :tech-stack="techStack" :progress="progress" :max-height="maxFooterHeight"
			:animate="animate" />
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import JobCardCover from '@/components/JobCardCover.vue'
import JobCardFooter from '@/components/JobCardFooter.vue'
import { extractTechStack } from '@/lib/techStack'
import { useMatchesStore } from '@/stores/matches'
import type { JobPosting } from '@/types'

const props = withDefaults(
	defineProps<{
		job: JobPosting
		/** How far the footer is raised, 0 (resting) to 1 */
		progress?: number
		/** Height in px the footer is capped at */
		maxFooterHeight?: number
		animate?: boolean
	}>(),
	{ progress: 0, maxFooterHeight: 0, animate: false },
)

const matchesStore = useMatchesStore()

const match = computed(() => {
	const state = matchesStore.analysisFor(props.job.id)
	return state.status === 'ready' ? state.data.score : null
})

const techStack = computed(() => extractTechStack(props.job))
</script>
