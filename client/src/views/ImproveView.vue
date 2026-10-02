<template>
	<!-- Same surface as the swipe column, but wider so link rows have room -->
	<section
		class="mx-auto w-full max-w-2xl flex-1 space-y-6 border-x border-border bg-surface px-4 py-4"
	>
		<header>
			<!-- ?details reopens the job details on the home view instead of the swipe card -->
			<RouterLink
				:to="{ name: 'home', query: { details: jobId } }"
				class="text-sm font-medium text-accent hover:text-accent-soft"
			>
				&larr; Back
			</RouterLink>
			<h1 class="mt-2 text-2xl font-semibold">Ways to improve</h1>
			<p v-if="job" class="mt-1 text-sm text-muted">
				{{ job.title }} at {{ job.company }}
				<span v-if="analysis"> &middot; Match {{ analysis.score }}%</span>
			</p>
		</header>

		<p v-if="state.status === 'loading'" class="text-sm text-muted">
			Analyzing this posting&hellip;
		</p>
		<p v-else-if="state.status === 'error'" class="text-sm text-muted">
			Couldn't analyze this posting: {{ state.error }}
		</p>
		<p v-else-if="!analysis" class="text-sm text-muted">No analysis for this job yet.</p>
		<p v-else-if="analysis.gaps.length === 0" class="text-sm text-muted">
			You already cover everything this posting asks for.
		</p>

		<template v-else>
			<div v-for="group in groups" :key="group.label" class="space-y-3">
				<div>
					<h2 class="font-semibold">{{ group.label }} ({{ group.items.length }})</h2>
					<p class="text-sm text-muted">{{ group.hint }}</p>
				</div>

				<article
					v-for="{ gap, tech, resources } in group.items"
					:key="gap.id"
					class="space-y-3 rounded-xl border border-border bg-card p-4"
				>
					<div>
						<h3 class="flex items-center gap-2 font-medium">
							<img
								v-if="tech"
								:src="`https://cdn.simpleicons.org/${tech.icon}/white`"
								:alt="`${tech.name} logo`"
								class="size-4"
							/>
							{{ gap.skill || gap.requirement }}
						</h3>
						<p v-if="gap.skill" class="mt-1 text-sm text-muted">
							{{ gap.requirement }}
						</p>
					</div>

					<blockquote
						v-if="gap.jobQuote"
						class="border-l-2 border-accent pl-3 text-sm text-neutral-300 italic"
					>
						&ldquo;{{ gap.jobQuote }}&rdquo;
					</blockquote>

					<ul v-if="resources.length" class="space-y-2">
						<li v-for="resource in resources" :key="resource.url">
							<a
								:href="resource.url"
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center justify-between gap-3 rounded-lg border border-border bg-page px-3 py-2 transition-colors hover:border-accent"
							>
								<span class="min-w-0">
									<span
										class="block truncate text-sm font-medium text-accent-soft"
									>
										{{ resource.title }}
									</span>
									<span class="block text-xs text-muted">
										{{ resource.provider }} &middot;
										{{ KIND_LABELS[resource.kind] }}
									</span>
								</span>
								<span class="shrink-0 text-xs text-muted">
									{{ resource.isFree ? 'Free' : 'Paid' }} &nearr;
								</span>
							</a>
						</li>
					</ul>
					<p v-else class="text-sm text-muted">
						This one can't be picked up from a course. If you have related experience,
						make sure your resume says so.
					</p>
				</article>
			</div>
		</template>
	</section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { resourcesForGap } from '@/lib/learningResources'
import { findTech } from '@/lib/techStack'
import { useJobsStore } from '@/stores/jobs'
import { useMatchesStore } from '@/stores/matches'
import type { Gap, ResourceKind } from '@/types'

const KIND_LABELS: Record<ResourceKind, string> = {
	course: 'Course',
	practice: 'Practice',
	docs: 'Guide',
	video: 'Video',
}

const route = useRoute()
const jobsStore = useJobsStore()
const matchesStore = useMatchesStore()

const jobId = computed(() => String(route.params.jobId))
const job = computed(() => jobsStore.jobById(jobId.value))
const state = computed(() => matchesStore.analysisFor(jobId.value))
const analysis = computed(() => (state.value.status === 'ready' ? state.value.data : null))

function toItems(gaps: Gap[]) {
	return gaps.map((gap) => ({
		gap,
		tech: findTech(gap.skill || gap.requirement),
		resources: resourcesForGap(gap),
	}))
}

const groups = computed(() => {
	const gaps = analysis.value?.gaps ?? []
	return [
		{
			label: 'Required',
			hint: 'The posting asks for these and your resume does not show them.',
			items: toItems(gaps.filter((gap) => gap.severity === 'major')),
		},
		{
			label: 'Nice to have',
			hint: 'Not required, but these would make you a stronger candidate.',
			items: toItems(gaps.filter((gap) => gap.severity !== 'major')),
		},
	].filter((group) => group.items.length > 0)
})
</script>
