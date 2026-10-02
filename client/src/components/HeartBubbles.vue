<template>
	<!-- Decorative; fixed to the viewport and never intercepts pointer events -->
	<div class="heart-layer pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
		<div v-for="heart in hearts" :key="heart.id" class="heart-rise absolute bottom-0"
			:style="{ left: heart.x + 'px', animationDuration: heart.duration + 's', '--size': heart.size + 'px' }"
			@animationend="remove(heart.id)">
			<svg viewBox="0 0 24 24" class="heart-sway fill-accent drop-shadow-lg"
				:style="{ width: heart.size + 'px', height: heart.size + 'px', animationDuration: heart.sway + 's', '--drift': heart.drift + 'px' }">
				<path d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
			</svg>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
	/** The phone-width column; hearts only spawn in the negative space on either side of it */
	column: HTMLElement | null
}>()

interface Heart {
	id: number
	x: number
	size: number
	duration: number
	sway: number
	drift: number
}

const MAX_HEARTS = 24
const hearts = ref<Heart[]>([])
let nextId = 0
let timer: ReturnType<typeof setTimeout> | undefined

const random = (min: number, max: number) => min + Math.random() * (max - min)

function remove(id: number) {
	hearts.value = hearts.value.filter((heart) => heart.id !== id)
}

/** Launch one heart from the bottom of the screen. Also callable from outside (e.g. on a websocket event). */
function spawn() {
	if (!props.column || hearts.value.length >= MAX_HEARTS) return

	const size = random(20, 44)
	const area = (props.column.closest('main') ?? document.body).getBoundingClientRect()
	const column = props.column.getBoundingClientRect()
	const gaps = [
		{ from: area.left + 8, to: column.left - 8 - size },
		{ from: column.right + 8, to: area.right - 8 - size },
	].filter((gap) => gap.to > gap.from)
	if (!gaps.length) return

	// Pick a side weighted by its width
	const total = gaps.reduce((sum, gap) => sum + (gap.to - gap.from), 0)
	let pick = Math.random() * total
	const gap = gaps.find((g) => (pick -= g.to - g.from) <= 0) ?? gaps[0]!

	hearts.value.push({
		id: nextId++,
		x: random(gap.from, gap.to),
		size,
		duration: random(4, 7),
		sway: random(1.5, 3),
		drift: random(12, 30),
	})
}

function schedule() {
	timer = setTimeout(() => {
		spawn()
		schedule()
	}, random(300, 1800))
}

onMounted(schedule)
onBeforeUnmount(() => clearTimeout(timer))

defineExpose({ spawn })
</script>

<style scoped>
.heart-rise {
	animation: heart-rise linear forwards;
}

.heart-sway {
	animation: heart-sway ease-in-out infinite alternate;
}

@keyframes heart-rise {
	0% {
		transform: translateY(var(--size));
		opacity: 0;
	}
	10% {
		opacity: 0.9;
	}
	70% {
		opacity: 0.7;
	}
	100% {
		transform: translateY(calc(-100vh - 20px));
		opacity: 0;
	}
}

@keyframes heart-sway {
	from {
		transform: translateX(calc(var(--drift) * -1));
	}
	to {
		transform: translateX(var(--drift));
	}
}

@media (prefers-reduced-motion: reduce) {
	.heart-layer {
		display: none;
	}
}
</style>
