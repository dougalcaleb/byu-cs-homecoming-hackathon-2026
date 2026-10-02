<script setup lang="ts">
import { computed } from 'vue'

// `label` names what the percentage measures, for screen readers
const props = withDefaults(defineProps<{ score: number; label?: string }>(), { label: 'Match' })

const RADIUS = 26
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// Length of the ring left unfilled
const offset = computed(() => CIRCUMFERENCE * (1 - Math.min(100, Math.max(0, props.score)) / 100))
</script>

<template>
	<div class="relative size-16 shrink-0" role="img" :aria-label="`${label} ${score}%`">
		<!-- Rotated so the ring fills clockwise from the top -->
		<svg viewBox="0 0 64 64" class="size-full -rotate-90">
			<circle
				cx="32"
				cy="32"
				:r="RADIUS"
				fill="none"
				stroke-width="6"
				class="stroke-border"
			/>
			<circle
				cx="32"
				cy="32"
				:r="RADIUS"
				fill="none"
				stroke-width="6"
				stroke-linecap="round"
				:stroke-dasharray="CIRCUMFERENCE"
				:stroke-dashoffset="offset"
				class="stroke-accent drop-shadow-[0_0_4px_var(--color-accent)]"
			/>
		</svg>
		<span class="absolute inset-0 flex items-center justify-center text-sm font-bold">
			{{ score }}%
		</span>
	</div>
</template>
