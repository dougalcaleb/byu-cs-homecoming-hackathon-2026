<template>
	<!-- Starts just below the cover's logo (logo top 7rem + 8rem tall + 1rem gap). Always shows everything,
		and scrolls if it does not fit. -->
	<div ref="scroller" @scroll="scrolled = (scroller?.scrollTop ?? 0) > 0"
		class="absolute inset-x-0 top-64 bottom-0 flex flex-col gap-2 overflow-y-auto bg-linear-to-t from-black/85 via-black/70 via-40% to-transparent px-4 pb-6 scrollbar-none">
		<!-- Sticks to the top while the rest scrolls under it; gets a backdrop once something is underneath -->
		<h2 class="sticky top-0 z-10 -mx-4 shrink-0 px-4 py-2 text-lg font-semibold leading-tight transition-colors"
			:class="scrolled ? 'bg-black/75 backdrop-blur-md' : ''">
			{{ job.title }}
		</h2>

		<div>
			<p class="shrink-0 text-sm text-neutral-300" :class="{ 'line-clamp-6': !descriptionExpanded }">{{ job.description }}</p>
			<a class="text-sm text-accent-soft cursor-pointer" @click="descriptionExpanded = !descriptionExpanded">Show {{ descriptionExpanded ? 'less' : 'more' }}</a>
		</div>

		<h2 class="mt-3">Tech Stack</h2>
		<TechStackList class="shrink-0" :items="techStack" />

		<h2 v-if="showQualifications" class="mt-3">Qualifications</h2>
		<div class="shrink-0 space-y-2 text-sm text-neutral-300" :class="{ 'line-clamp-6': !qualificationsExpanded }">
			<p class="text-neutral-400">{{ meta }}</p>
			<ul v-if="showQualifications" class="list-disc space-y-0.5 pl-5">
				<li v-for="item in job.highlights.qualifications" :key="item">{{ item }}</li>
			</ul>
		</div>
		<a v-if="showQualifications" class="text-sm text-accent-soft cursor-pointer" @click="qualificationsExpanded = !qualificationsExpanded">Show {{ qualificationsExpanded ? 'less' : 'more' }}</a>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import TechStackList, { type Tech } from '@/components/TechStackList.vue'
import type { JobPosting } from '@/types'

const props = defineProps<{
	job: JobPosting
	techStack: Tech[]
}>()

const meta = computed(() =>
	[props.job.location, props.job.employmentType, props.job.salary, props.job.postedAt].filter(Boolean).join(' · '),
)

const showQualifications = computed(() => !!props.job.highlights.qualifications.length)

let descriptionExpanded = ref<boolean>(false);
let qualificationsExpanded = ref<boolean>(false);

const scroller = ref<HTMLElement | null>(null)
const scrolled = ref(false)

// The same footer instance is reused when the card moves on to the next job, so start that job fresh
watch(
	() => props.job.id,
	() => {
		descriptionExpanded.value = false
		qualificationsExpanded.value = false
		scrolled.value = false
		if (scroller.value) scroller.value.scrollTop = 0
	},
)
</script>

<style scoped>
</style>