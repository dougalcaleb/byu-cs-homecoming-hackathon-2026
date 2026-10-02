<template>
	<!-- The root is sized by its parent. The details scroll in the middle; the actions below them stay put. -->
	<div class="flex flex-col">
		<div class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
			<button class="cursor-pointer self-end text-sm text-accent-soft" @click="emit('back')">Back &rsaquo;</button>

			<header>
				<h2 class="text-2xl font-semibold">{{ job.title }}</h2>
				<p class="text-sm text-muted">
					{{ [job.company, job.location, job.employmentType, job.salary].filter(Boolean).join(' · ') }}
				</p>
			</header>

			<p class="text-sm leading-relaxed text-neutral-300">{{ job.description }}</p>

			<template v-for="group in groups" :key="group.label">
				<section v-if="group.items.length">
					<h3 class="mb-1 text-sm font-semibold text-accent">{{ group.label }}</h3>
					<ul class="list-disc space-y-1 pl-5 text-sm text-neutral-300">
						<li v-for="item in group.items" :key="item">{{ item }}</li>
					</ul>
				</section>
			</template>
		</div>

		<!-- Always visible, so the user never has to scroll to find them -->
		<div class="flex shrink-0 flex-wrap gap-2 border-t border-border bg-surface p-4">
			<a v-for="link in job.applyLinks" :key="link.url" :href="link.url" target="_blank" rel="noopener"
				class="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-page" @click="emit('apply')">
				Apply on {{ link.label }}
			</a>
			<RouterLink :to="{ name: 'improve', params: { jobId: job.id } }"
				class="rounded-full border border-accent px-4 py-2 text-sm font-semibold text-accent">
				Ways to improve
			</RouterLink>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { JobPosting } from '@/types'

const props = defineProps<{ job: JobPosting }>()
// 'apply' fires when an Apply link is clicked; the link still opens the application in a new tab
const emit = defineEmits<{ back: []; apply: [] }>()

const groups = computed(() => [
	{ label: 'Qualifications', items: props.job.highlights.qualifications },
	{ label: 'Responsibilities', items: props.job.highlights.responsibilities },
	{ label: 'Benefits', items: props.job.highlights.benefits },
])
</script>
