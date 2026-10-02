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

					<JobCard data-current :job="job" class="left-0" />

					<!-- Prerendered next job, directly right of the current card -->
					<JobCard v-if="nextJob" :job="nextJob" class="left-full" :class="{ invisible: side === 'right' }"
						aria-hidden="true" />
				</div>
			</div>
		</section>
	</div>

	<div v-else class="m-auto flex flex-col items-center gap-3 px-6 text-center text-sm text-muted">
		<template v-if="loadError">
			<p>{{ loadError }}</p>
			<button class="rounded-full bg-accent px-4 py-2 font-semibold text-page" @click="loadMore">Try again</button>
		</template>
		<p v-else-if="loadingMore">Finding jobs for you…</p>
		<template v-else-if="!resumeStore.current">
			<p>Upload your resume to see jobs matched to you.</p>
			<RouterLink to="/onboarding" class="rounded-full bg-accent px-4 py-2 font-semibold text-page">Add resume</RouterLink>
		</template>
		<p v-else>No more jobs to show.</p>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import JobDetails from '@/components/JobDetails.vue'
import HeartBubbles from '@/components/HeartBubbles.vue'
import JobCard from '@/components/JobCard.vue'
import { coverBackground, prefetchBrand } from '@/lib/brand'
import { fetchRecommendations } from '@/lib/api'
import { useJobsStore } from '@/stores/jobs'
import { useResumeStore } from '@/stores/resume'

const jobsStore = useJobsStore()
const resumeStore = useResumeStore()

// ---------- Job queue ----------

// Ask the API for the next batch when this many (or fewer) unswiped jobs are left
const LOW_WATER = 5

const loadingMore = ref(false)
const loadError = ref<string | null>(null)
// Set when the API has nothing new to offer, so an empty answer does not trigger endless refetching
let exhausted = false

async function loadMore() {
	if (loadingMore.value) return
	loadingMore.value = true
	loadError.value = null
	try {
		const resume = resumeStore.current
		const response = await fetchRecommendations({
			profile: resume?.searchProfile ?? { titles: [], keywords: [] },
			skills: resume?.skills ?? [],
			resumeText: resume?.rawText,
			// The full history, oldest first: the API retrains from it and never repeats a swiped job
			swipes: Object.values(jobsStore.swipes).sort((a, b) => a.swipedAt.localeCompare(b.swipedAt)),
			limit: 30,
		})
		exhausted = jobsStore.addRecommendations(response.recommendations) === 0
	} catch (error) {
		loadError.value = error instanceof Error ? error.message : 'Could not load jobs'
	} finally {
		loadingMore.value = false
	}
}

// Top up the queue whenever it runs low (and once on load)
watch(
	() => jobsStore.deck.length,
	(remaining) => {
		if (remaining <= LOW_WATER && !exhausted && !loadError.value) void loadMore()
	},
	{ immediate: true },
)

// The job currently on screen: the first one not yet swiped
const job = computed(() => jobsStore.deck[0])

// The job after the current one, prerendered so it can slide in
const nextJob = computed(() => jobsStore.deck[1])

// Prefetch every queued job's logo up front, so cards never wait on the network when they come into view
watch(
	() => jobsStore.all,
	(jobs) => jobs.forEach(prefetchBrand),
	{ immediate: true },
)

// ---------- Layout ----------

const column = ref<HTMLElement | null>(null)
const viewport = ref<HTMLElement | null>(null)
const cardWidth = ref(0)

const updateSize = () => {
	cardWidth.value = viewport.value?.clientWidth ?? 0
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

// Which way the strip last moved. Lags behind dragX by one transition, so the carousel clip and the
// hidden next card don't switch mid-animation.
const side = ref<'left' | 'right' | 'none'>('none')
let sideTimer: ReturnType<typeof setTimeout> | undefined

watch(dragX, (value) => {
	clearTimeout(sideTimer)
	if (value !== 0) side.value = value < 0 ? 'left' : 'right'
	else sideTimer = setTimeout(() => (side.value = 'none'), 250)
})

// Pointer movement (px) before a press counts as a drag. Below it, the press is a click on whatever is under it.
const DRAG_SLOP = 6

let startX = 0
let downX = 0
let captured = false
let pointerActive = false

// A pass is committed once the carousel has finished sliding. A new drag can start before that happens, so the
// commit is idempotent: whichever comes first (the timer or the next pointerdown) finishes it.
let passTimer: ReturnType<typeof setTimeout> | undefined

function finishPass() {
	if (passTimer === undefined) return
	clearTimeout(passTimer)
	passTimer = undefined

	if (job.value) jobsStore.swipe(job.value.id, 'pass')
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
	captured = false
	downX = event.clientX
	startX = event.clientX - dragX.value
	// The pointer is only captured once it moves (see onPointerMove), so a plain click still reaches the
	// button or link under it. If it is released before then, the section never hears about it, so also
	// listen on the window.
	window.addEventListener('pointerup', onPointerEnd)
	window.addEventListener('pointercancel', onPointerEnd)
}

function onPointerMove(event: PointerEvent) {
	if (!dragging.value) return
	if (!captured) {
		if (Math.abs(event.clientX - downX) < DRAG_SLOP) return
		// It is a drag, not a click: from here on the section gets every event, wherever the pointer goes
		;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
		captured = true
		startX = event.clientX - dragX.value
	}
	const x = event.clientX - startX
	// Details open: the card can only be dragged back in (left). Otherwise: at most one card-width either way.
	dragX.value = liked.value
		? Math.max(0, Math.min(x, likedOffset()))
		: Math.max(-cardWidth.value, Math.min(x, likedOffset()))
}

function onPointerEnd() {
	window.removeEventListener('pointerup', onPointerEnd)
	window.removeEventListener('pointercancel', onPointerEnd)
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
