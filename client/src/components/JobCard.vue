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
import type { Tech } from '@/components/TechStackList.vue'
import { extractTechStack } from '@/lib/techStack'
import { useJobsStore } from '@/stores/jobs'
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
const jobsStore = useJobsStore()

const recommendation = computed(() => jobsStore.recommendations[props.job.id])

// A full match analysis wins; before that, the ranking API's predicted score
const match = computed(() => {
	const state = matchesStore.analysisFor(props.job.id)
	if (state.status === 'ready') return state.data.score
	return recommendation.value ? Math.round(recommendation.value.score) : null
})

// The skills the API found in the posting (the ones that have an icon), else a keyword scan of the text
const techStack = computed<Tech[]>(() => {
	const skills = [...(recommendation.value?.matchedSkills ?? []), ...(recommendation.value?.missingSkills ?? [])]
	const seen = new Set<string>()
	const tags = skills.flatMap((skill) =>
		skill.icon && !seen.has(skill.name) && seen.add(skill.name) ? [{ name: skill.name, icon: skill.icon }] : [],
	)
	return tags.length ? tags : extractTechStack(props.job)
})
</script>
