<template>
	<!-- Same surface as the swipe column, but wider so link rows have room -->
	<section
		class="mx-auto w-full max-w-2xl flex-1 space-y-5 border-x border-border bg-surface px-4 py-4"
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
			<p v-if="job" class="mt-0.5 text-sm text-muted">{{ job.title }} at {{ job.company }}</p>
		</header>

		<p v-if="state.status === 'loading'" class="text-sm text-muted">
			Analyzing this posting&hellip;
		</p>
		<p v-else-if="state.status === 'error'" class="text-sm text-muted">
			Couldn't analyze this posting: {{ state.error }}
		</p>
		<p v-else-if="!analysis" class="text-sm text-muted">No analysis for this job yet.</p>

		<template v-else>
			<!-- Summary: the whole page at a glance -->
			<div class="rise rounded-2xl border border-border bg-card p-4">
				<div class="flex items-center gap-4">
					<ScoreRing :score="analysis.score" />
					<div class="min-w-0">
						<p class="text-lg leading-tight font-semibold">{{ headline }}</p>
						<p v-if="items.length" class="mt-1 text-sm text-muted">
							<span v-if="requiredCount" class="text-amber-300">
								{{ requiredCount }} required
							</span>
							<span v-if="requiredCount && niceCount"> &middot; </span>
							<span v-if="niceCount" class="text-accent-soft">
								{{ niceCount }} nice to have
							</span>
						</p>
					</div>
				</div>

				<!-- Each pill jumps to its card -->
				<ul v-if="items.length" class="mt-4 flex flex-wrap gap-1.5">
					<li v-for="{ gap, tech } in items" :key="gap.id">
						<button
							class="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
							:class="
								gap.severity === 'major'
									? 'bg-amber-400/15 text-amber-300 hover:bg-amber-400/25'
									: 'bg-accent/10 text-accent-soft hover:bg-accent/20'
							"
							@click="jumpTo(gap.id)"
						>
							<img
								v-if="tech"
								:src="`https://cdn.simpleicons.org/${tech.icon}/white`"
								alt=""
								class="size-3"
							/>
							{{ gap.skill || gap.requirement }}
						</button>
					</li>
				</ul>
			</div>

			<div v-for="group in groups" :key="group.label" class="space-y-2">
				<h2
					class="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase"
				>
					<span class="size-2 rounded-full" :class="group.dot" />
					{{ group.label }}
					<span class="text-muted/60">{{ group.items.length }}</span>
				</h2>

				<GapCard
					v-for="item in group.items"
					:id="`gap-${item.gap.id}`"
					:key="item.gap.id"
					class="rise scroll-mt-20"
					:style="{ animationDelay: `${item.order * 60}ms` }"
					:gap="item.gap"
					:tech="item.tech"
					:resources="item.resources"
					:open="openId === item.gap.id"
					@toggle="toggle(item.gap.id)"
				/>
			</div>
		</template>
	</section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRoute } from 'vue-router'
import GapCard from '@/components/improve/GapCard.vue'
import ScoreRing from '@/components/improve/ScoreRing.vue'
import { resourcesForGap } from '@/lib/learningResources'
import { findTech } from '@/lib/techStack'
import { useJobsStore } from '@/stores/jobs'
import { useMatchesStore } from '@/stores/matches'

const route = useRoute()
const jobsStore = useJobsStore()
const matchesStore = useMatchesStore()

const jobId = computed(() => String(route.params.jobId))
const job = computed(() => jobsStore.jobById(jobId.value))
const state = computed(() => matchesStore.analysisFor(jobId.value))
const analysis = computed(() => (state.value.status === 'ready' ? state.value.data : null))

// Required gaps first; `order` staggers the entrance animation
const items = computed(() => {
	const gaps = analysis.value?.gaps ?? []
	const sorted = [
		...gaps.filter((gap) => gap.severity === 'major'),
		...gaps.filter((gap) => gap.severity !== 'major'),
	]
	return sorted.map((gap, index) => ({
		gap,
		order: index + 1,
		tech: findTech(gap.skill || gap.requirement),
		resources: resourcesForGap(gap),
	}))
})

const requiredCount = computed(
	() => items.value.filter((item) => item.gap.severity === 'major').length,
)
const niceCount = computed(() => items.value.length - requiredCount.value)

const headline = computed(() => {
	const count = items.value.length
	if (count === 0) return 'You already cover everything this posting asks for.'
	return `${count} ${count === 1 ? 'skill' : 'skills'} between you and this job`
})

const groups = computed(() =>
	[
		{
			label: 'Required',
			dot: 'bg-amber-400',
			items: items.value.filter((item) => item.gap.severity === 'major'),
		},
		{
			label: 'Nice to have',
			dot: 'bg-accent',
			items: items.value.filter((item) => item.gap.severity !== 'major'),
		},
	].filter((group) => group.items.length > 0),
)

// One card open at a time; until the user picks, the first (most important) gap is open
const picked = ref<string | null>()
const openId = computed(() =>
	picked.value === undefined ? (items.value[0]?.gap.id ?? null) : picked.value,
)

function toggle(id: string) {
	picked.value = openId.value === id ? null : id
}

async function jumpTo(id: string) {
	picked.value = id
	await nextTick()
	document.getElementById(`gap-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>
