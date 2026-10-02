<template>
	<!-- Only this view is a phone-width column; the swipe hints sit in the negative space beside it -->
	<div v-if="job" ref="column" class="relative mx-auto flex w-full max-w-md flex-1">
		<HeartBubbles :column="column" />

		<!-- Page background: the current job's brand gradient, blurred and dimmed -->
		<div class="pointer-events-none fixed inset-0 -z-10 scale-110 blur-3xl" :style="{ background: coverBackground(job.company) }" />
		<div class="pointer-events-none fixed inset-0 -z-10 bg-black/80" />

		<template v-if="!liked">
			<span class="pointer-events-none absolute top-1/2 whitespace-nowrap right-full mr-4 -translate-y-1/2 text-md font-medium text-neutral-300">
				&lsaquo; Pass
			</span>
			<span class="pointer-events-none absolute top-1/2 whitespace-nowrap left-full ml-4 -translate-y-1/2 text-md font-medium text-neutral-300">
				Like &rsaquo;
			</span>
		</template>

		<!-- All pointer input is handled here, on an element that never moves, so a drag can always be picked up
			(even while the cards are still animating) and pointer capture is never lost when the cards change -->
		<section ref="viewport" class="relative flex-1 touch-pan-y select-none" @pointerdown="onPointerDown"
			@pointermove="onPointerMove" @pointerup="onPointerEnd" @pointercancel="onPointerEnd"
			@lostpointercapture="onPointerEnd">
			<!-- Dragging left makes a carousel, so clip to the section; the next card slides in from its right edge -->
			<div class="absolute inset-0" :class="{ 'overflow-hidden': side !== 'right' }">
				<!-- One strip carries everything and follows the drag: details | current card | next card -->
				<div class="absolute inset-0" :class="{ 'transition-transform duration-200': !dragging }"
					:style="{ transform: `translateX(${dragX}px)` }">
					<!-- Grows out of the card's left edge (width = 2x the rightward drag) so the pair ends up centered on the page -->
					<div class="absolute inset-y-0 right-full overflow-hidden"
						:class="{ 'transition-[width] duration-200': !dragging }"
						:style="{ width: Math.max(0, dragX * 2) + 'px' }">
						<JobDetails :job="job" class="absolute inset-y-0 right-0 border-l border-border bg-surface"
							:style="{ width: cardWidth + 'px' }" :inert="!liked" @back="resetCard" />
					</div>

					<JobCard data-current :job="job" class="left-0" :progress="progress"
						:max-footer-height="cardHeight * 0.65" :animate="!dragging" />

					<!-- Prerendered next job, directly right of the current card -->
					<JobCard v-if="nextJob" :job="nextJob" class="left-full" :class="{ invisible: side === 'right' }"
						aria-hidden="true" />
				</div>
			</div>
		</section>
	</div>

	<p v-else class="m-auto text-sm text-muted">No more jobs to show.</p>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import JobDetails from '@/components/JobDetails.vue'
import HeartBubbles from '@/components/HeartBubbles.vue'
import JobCard from '@/components/JobCard.vue'
import { coverBackground, prefetchBrand } from '@/lib/brand'
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

// Temporary stand-in for the backend: when the local queue runs out, loop back to the first listing.
// A real implementation would fetch the next batch and call jobsStore.setJobs() here.
function refillQueue() {
	for (const queued of jobsStore.all) jobsStore.undoSwipe(queued.id)
}
if (jobsStore.all.length && !jobsStore.deck.length) refillQueue()

// The job currently on screen: the first one not yet swiped
const job = computed(() => jobsStore.deck[0])

// The job after the current one (wraps to the first listing, matching refillQueue)
const nextJob = computed(() => jobsStore.deck[1] ?? jobsStore.all[0])

// Prefetch every queued job's logo up front, so cards never wait on the network when they come into view
watch(
	() => jobsStore.all,
	(jobs) => jobs.forEach((queued) => prefetchBrand(queued.company)),
	{ immediate: true },
)

// ---------- Layout ----------

const column = ref<HTMLElement | null>(null)
const viewport = ref<HTMLElement | null>(null)
const cardWidth = ref(0)
const cardHeight = ref(0)

const updateSize = () => {
	cardWidth.value = viewport.value?.clientWidth ?? 0
	cardHeight.value = viewport.value?.clientHeight ?? 0
}

// Track the section's size for as long as it exists (a single measurement on mount can run before styles apply)
const sizeObserver = new ResizeObserver(updateSize)
watch(
	viewport,
	(el, previous) => {
		if (previous) sizeObserver.unobserve(previous)
		if (el) sizeObserver.observe(el)
		updateSize()
	},
	{ flush: 'post' },
)
onMounted(updateSize)

// Resting offset after a swipe right: half a window, so details + card are centered on the page
const likedOffset = () => cardWidth.value / 2

// ---------- Swipe state ----------

const SWIPE_THRESHOLD = 100 // px of horizontal drag needed to count as a swipe

// Horizontal offset of the whole strip: negative while swiping left (carousel), positive for right
const dragX = ref(0)
const dragging = ref(false)
// Card swiped right; details are showing
const liked = ref(false)

// How far the footer is raised: 0 at rest, 1 once swiped right
const progress = computed(() => (likedOffset() ? Math.min(1, Math.max(0, dragX.value / likedOffset())) : 0))

// Which way the strip last moved. Lags behind dragX by one transition, so the carousel clip and the
// hidden next card don't switch mid-animation.
const side = ref<'left' | 'right' | 'none'>('none')
let sideTimer: ReturnType<typeof setTimeout> | undefined

watch(dragX, (value) => {
	clearTimeout(sideTimer)
	if (value !== 0) side.value = value < 0 ? 'left' : 'right'
	else sideTimer = setTimeout(() => (side.value = 'none'), 250)
})

let startX = 0
let pointerActive = false

// A pass is committed once the carousel has finished sliding. A new drag can start before that happens, so the
// commit is idempotent: whichever comes first (the timer or the next pointerdown) finishes it.
let passTimer: ReturnType<typeof setTimeout> | undefined

function finishPass() {
	if (passTimer === undefined) return
	clearTimeout(passTimer)
	passTimer = undefined

	if (job.value) jobsStore.swipe(job.value.id, 'pass')
	if (!jobsStore.deck.length) refillQueue()
	// The next card is now the current one and is already in view; snap the strip back without animating
	dragging.value = true
	dragX.value = 0
	// Re-enable transitions, unless the user has already grabbed the strip again. The browser must apply the
	// transition-free snap first (a forced reflow), otherwise it animates the snap instead of jumping.
	void nextTick(() => {
		void viewport.value?.offsetWidth
		if (!pointerActive) dragging.value = false
	})
}

function onPointerDown(event: PointerEvent) {
	// With the details open, only the card itself can be dragged (to go back)
	if (liked.value && !(event.target as HTMLElement).closest('[data-current]')) return

	finishPass()
	pointerActive = true
	dragging.value = true
	startX = event.clientX - dragX.value
	;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
	if (!dragging.value) return
	const x = event.clientX - startX
	// Details open: the card can only be dragged back in (left). Otherwise: at most one card-width either way.
	dragX.value = liked.value
		? Math.max(0, Math.min(x, likedOffset()))
		: Math.max(-cardWidth.value, Math.min(x, likedOffset()))
}

function onPointerEnd() {
	pointerActive = false
	if (!dragging.value) return
	dragging.value = false

	if (liked.value) {
		// Swipe back: pull the card back in, or settle in the open position again
		if (dragX.value < likedOffset() - SWIPE_THRESHOLD) resetCard()
		else dragX.value = likedOffset()
		return
	}

	if (Math.abs(dragX.value) < SWIPE_THRESHOLD) {
		dragX.value = 0
		return
	}

	if (dragX.value > 0) {
		// Swipe right: reveal the details
		liked.value = true
		dragX.value = likedOffset()
		return
	}

	// Swipe left: finish sliding the next card into place, then record the pass
	dragX.value = -cardWidth.value
	passTimer = setTimeout(finishPass, 220)
}

function resetCard() {
	liked.value = false
	dragX.value = 0
}

// Safety net: whenever nothing is being dragged or animating, the strip must be at rest
// (centered, or in the open position). Heals any state a missed pointer event could leave behind.
watch([dragging, dragX], () => {
	if (dragging.value || pointerActive || passTimer !== undefined) return
	const rest = liked.value ? likedOffset() : 0
	if (dragX.value !== rest) dragX.value = rest
})

onUnmounted(() => {
	sizeObserver.disconnect()
	clearTimeout(sideTimer)
	finishPass()
})
</script>
