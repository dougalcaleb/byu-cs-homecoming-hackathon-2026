<template>
	<div class="absolute inset-x-0 bottom-0 flex flex-col gap-2 overflow-hidden bg-linear-to-t from-black/85 via-black/70 via-40% to-transparent px-4 pt-14 pb-6"
		:style="{ maxHeight: maxHeight ? maxHeight + 'px' : undefined }">
		<h2 class="shrink-0 text-lg font-semibold leading-tight">{{ job.title }}</h2>

		<!-- Three lines at rest; grows with the swipe, and scrolls if the full text doesn't fit -->
		<p class="min-h-0 text-sm text-neutral-300 [scrollbar-width:thin]"
			:class="[progress === 0 ? 'line-clamp-3' : '', progress === 1 ? 'overflow-y-auto' : 'overflow-hidden', { 'transition-[max-height] duration-200': animate }]"
			:style="{ maxHeight: descriptionMaxHeight + 'px' }">
			{{ job.description }}
		</p>

		<TechStackList class="shrink-0" :items="techStack" />

		<!-- Extra info that fades in as the footer is raised -->
		<div class="shrink-0 space-y-2 overflow-hidden text-sm text-neutral-300"
			:class="{ 'transition-[opacity,max-height] duration-200': animate }"
			:style="{ opacity: progress, maxHeight: progress * 160 + 'px' }">
			<p class="text-neutral-400">{{ meta }}</p>
			<ul v-if="job.highlights.qualifications.length" class="list-disc space-y-0.5 pl-5">
				<li v-for="item in job.highlights.qualifications" :key="item">{{ item }}</li>
			</ul>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TechStackList, { type Tech } from '@/components/TechStackList.vue'
import type { JobPosting } from '@/types'

// Height of three lines of description (text-sm = 20px line height)
const COLLAPSED_DESCRIPTION_HEIGHT = 60

const props = defineProps<{
	job: JobPosting
	techStack: Tech[]
	/** 0 (resting) to 1 (fully raised) */
	progress: number
	/** Hard cap in px on the footer height. The footer is only as tall as its content, so the gradient is too. */
	maxHeight: number
	/** Animate height/opacity changes (off while the user is dragging) */
	animate: boolean
}>()

const descriptionMaxHeight = computed(
	() => COLLAPSED_DESCRIPTION_HEIGHT + props.progress * Math.max(0, props.maxHeight - COLLAPSED_DESCRIPTION_HEIGHT),
)

const meta = computed(() =>
	[props.job.location, props.job.employmentType, props.job.salary, props.job.postedAt].filter(Boolean).join(' · '),
)
</script>
