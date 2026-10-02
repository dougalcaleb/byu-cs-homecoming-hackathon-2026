<template>
	<!-- Only this view is a phone-width column; the swipe hints sit in the negative space beside it -->
	<div v-if="job" class="relative mx-auto flex w-full max-w-md flex-1">
		<template v-if="!liked">
			<span class="pointer-events-none absolute top-1/2 whitespace-nowrap right-full mr-4 -translate-y-1/2 text-md font-medium text-neutral-500">
				&lsaquo; Pass
			</span>
			<span class="pointer-events-none absolute top-1/2 whitespace-nowrap left-full ml-4 -translate-y-1/2 text-md font-medium text-neutral-500">
				Like &rsaquo;
			</span>
		</template>

		<section ref="viewport" class="relative flex-1">
			<!-- The strip moves as one: the details window sits directly left of the card, sharing a border -->
			<div class="absolute inset-0" :class="{ 'transition-transform duration-200': !dragging }" :style="cardStyle">
				<!-- Grows out of the card's left edge (width = 2x the drag) so the pair ends up centered on the page -->
				<div class="absolute inset-y-0 right-full overflow-hidden" :class="{ 'transition-[width] duration-200': !dragging }"
					:style="{ width: Math.max(0, dragX * 2) + 'px' }">
					<JobDetails :job="job" class="absolute inset-y-0 right-0 touch-pan-y border-l border-border bg-surface"
						:style="{ width: cardWidth + 'px' }" :inert="!liked" @back="resetCard"
						@pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerEnd"
						@pointercancel="onPointerEnd" />
				</div>

				<div class="absolute inset-0 touch-pan-y select-none overflow-hidden border-x border-border bg-surface"
					:class="{ 'pointer-events-none': liked }" @pointerdown="onPointerDown" @pointermove="onPointerMove"
					@pointerup="onPointerEnd" @pointercancel="onPointerEnd">
					<img src="/handsome.png" :alt="`${job.company} cover image`" draggable="false"
						class="pointer-events-none absolute inset-0 size-full object-cover object-top" />

					<div class="absolute inset-x-0 top-0 bg-linear-to-b from-black to-transparent px-4 pt-4 pb-12">
						<h1 class="text-3xl font-semibold drop-shadow-xl">{{ job.company }}</h1>
						<p class="text-sm text-neutral-200 drop-shadow">Hiring: {{ job.title }}</p>
						<p v-if="match !== null" class="text-sm font-medium text-accent-soft drop-shadow">Match {{ match }}%</p>
					</div>

					<div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black to-transparent px-4 pt-10 pb-4">
						<TechStackList :items="techStack" />
					</div>
				</div>
			</div>
		</section>
	</div>

	<p v-else class="m-auto text-sm text-muted">No more jobs to show.</p>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import JobDetails from '@/components/JobDetails.vue'
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

// ---------- Swipe ----------

const SWIPE_THRESHOLD = 100 // px of horizontal drag needed to count as a swipe

const viewport = ref<HTMLElement | null>(null)
const cardWidth = ref(0)
const updateWidth = () => (cardWidth.value = viewport.value?.clientWidth ?? 0)
onMounted(() => {
	updateWidth()
	window.addEventListener('resize', updateWidth)
})
onUnmounted(() => window.removeEventListener('resize', updateWidth))

// Distance the card must travel to be fully out of the section
const offscreen = () => cardWidth.value
// Resting offset after a swipe right: half a window, so details + card are centered on the page
const likedOffset = () => cardWidth.value / 2

const dragX = ref(0)
const dragging = ref(false)
const liked = ref(false) // card swiped right; details are showing
let startX = 0

const cardStyle = computed(() => ({
	transform: `translateX(${dragX.value}px)`,
}))

function onPointerDown(event: PointerEvent) {
	// On the details view, only empty space (the container itself, not its content) starts a swipe back
	if (liked.value && event.target !== event.currentTarget) return
	dragging.value = true
	startX = event.clientX - dragX.value
	;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
	if (!dragging.value) return
	const x = event.clientX - startX
	// Details view: the card can only be dragged back in (left), never further right
	dragX.value = liked.value ? Math.max(0, Math.min(x, likedOffset())) : Math.min(x, likedOffset())
}

function onPointerEnd() {
	if (!dragging.value) return
	dragging.value = false

	if (liked.value) {
		// Swipe back: pull the card back in, or settle off screen again
		if (dragX.value < likedOffset() - SWIPE_THRESHOLD) resetCard()
		else dragX.value = likedOffset()
		return
	}

	if (Math.abs(dragX.value) < SWIPE_THRESHOLD) {
		dragX.value = 0
		return
	}


	if (dragX.value > 0) {
		// Swipe right: fly off to reveal the details underneath
		liked.value = true
		dragX.value = likedOffset()
		return
	}

	// Swipe left: fly off, react, then snap back (placeholder until the deck advances)
	dragX.value = -offscreen()
	setTimeout(() => {
		alert('Swiped left (pass)')
		dragging.value = true // snap back without animating
		dragX.value = 0
		requestAnimationFrame(() => (dragging.value = false))
	}, 200)
}

const techStack = computed(() => (job.value ? extractTechStack(job.value) : []))

function resetCard() {
	liked.value = false
	dragX.value = 0
}
</script>
