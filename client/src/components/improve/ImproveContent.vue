<template>
	<!-- The Ways to improve body for one job. Used by the /improve/:jobId page and by the swipe deck's side window. -->
	<div class="space-y-5">
		<header>
			<!-- The page puts its Back link here -->
			<slot name="before-title" />
			<h1 class="text-2xl font-semibold" :class="{ 'mt-2': $slots['before-title'] }">Tailor-fit your Resume</h1>
			<p v-if="job" class="mt-0.5 text-sm text-muted">{{ job.title }} at {{ job.company }}</p>
		</header>

		<p v-if="!analysis && state.status === 'loading'" class="text-sm text-muted">
			Analyzing this posting&hellip;
		</p>
		<p v-else-if="!analysis && state.status === 'error'" class="text-sm text-muted">
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
						<!-- Required skills get a + (outside the jump button) that adds the skill to the profile -->
						<div
							class="flex items-center rounded-full text-xs font-medium transition-colors"
							:class="
								gap.severity === 'major'
									? 'bg-amber-400/15 text-amber-300 hover:bg-amber-400/25'
									: 'bg-accent/10 text-accent-soft hover:bg-accent/20'
							"
						>
							<button class="flex cursor-pointer items-center gap-1.5 py-1 pl-3" :class="canAdd(gap) ? 'pr-1.5' : 'pr-3'" @click="jumpTo(gap.id)">
								<img
									v-if="tech"
									:src="`https://cdn.simpleicons.org/${tech.icon}/white`"
									alt=""
									class="size-3"
								/>
								{{ gap.skill || gap.requirement }}
							</button>
							<AddSkillButton
								v-if="canAdd(gap)"
								class="mr-1"
								size="sm"
								:skill="gap.skill"
								:added="resumeStore.hasSkill(gap.skill)"
								@add="resumeStore.addSkill(gap.skill)"
								@remove="resumeStore.removeSkill(gap.skill)"
							/>
						</div>
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
					:can-add="canAdd(item.gap)"
					:added="resumeStore.hasSkill(item.gap.skill)"
					@toggle="toggle(item.gap.id)"
					@add-skill="resumeStore.addSkill(item.gap.skill)"
					@remove-skill="resumeStore.removeSkill(item.gap.skill)"
				/>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import AddSkillButton from '@/components/improve/AddSkillButton.vue'
import GapCard from '@/components/improve/GapCard.vue'
import ScoreRing from '@/components/improve/ScoreRing.vue'
import { analysisFromRecommendation } from '@/lib/gapAnalysis'
import { resourcesForGap } from '@/lib/learningResources'
import { findTech } from '@/lib/techStack'
import { useJobsStore } from '@/stores/jobs'
import { useMatchesStore } from '@/stores/matches'
import { useResumeStore } from '@/stores/resume'
import type { Gap } from '@/types'

const props = defineProps<{ jobId: string }>()

const jobsStore = useJobsStore()
const matchesStore = useMatchesStore()
const resumeStore = useResumeStore()

const job = computed(() => jobsStore.jobById(props.jobId))
const state = computed(() => matchesStore.analysisFor(props.jobId))
// Until real match analysis exists, jobs from the ranking API fall back to their missing skills
const analysis = computed(() => {
	if (state.value.status === 'ready') return state.value.data
	const recommendation = jobsStore.recommendations[props.jobId]
	if (!recommendation) return null
	return analysisFromRecommendation(recommendation, resumeStore.current?.id ?? '')
})

// The ranking API's skill tags have checked icon slugs; techStack's older list is the fallback
function apiTech(skill: string) {
	const tag = jobsStore.recommendations[props.jobId]?.missingSkills.find((t) => t.name === skill)
	return tag?.icon ? { name: tag.name, icon: tag.icon } : undefined
}

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
		tech: apiTech(gap.skill) ?? findTech(gap.skill || gap.requirement),
		resources: resourcesForGap(gap),
	}))
})

// Only required skills can be added, only when there is a resume to add them to, and only when the gap
// names a short skill (not a whole requirement sentence)
function canAdd(gap: Gap) {
	return gap.severity === 'major' && !!gap.skill && !!resumeStore.current
}

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

// The deck reuses this component as it moves from job to job, so each job starts with its own first card open
watch(
	() => props.jobId,
	() => (picked.value = undefined),
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
