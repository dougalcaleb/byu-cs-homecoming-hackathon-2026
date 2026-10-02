<template>
	<!-- Cover art: the company's logo on a gradient from its brand color, or a monogram until a logo is available -->
	<div class="absolute inset-0 flex items-start justify-center pt-28" :style="{ background: coverBackground(job.company) }">
		<div v-if="logo" class="flex size-32 items-center justify-center bg-white rounded-2xl shadow-2xl">
			<img :src="logo" :alt="`${job.company} logo`" draggable="false" class="size-full object-contain rounded-2xl" />
		</div>
		<div v-else role="img" :aria-label="`${job.company} logo`"
			class="flex size-32 items-center justify-center rounded-3xl bg-white/15 text-5xl font-bold tracking-tight text-white shadow-2xl backdrop-blur">
			{{ monogram(job.company) }}
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { coverBackground, logoFor, prefetchBrand } from '@/lib/brand'
import { monogram } from '@/lib/cover'
import type { JobPosting } from '@/types'

const props = defineProps<{ job: JobPosting }>()

// Normally already prefetched by the deck; this covers any card shown before that happens
watchEffect(() => prefetchBrand(props.job))

// Only set once the logo is loaded and decoded, so it never pops in or flashes a broken image
const logo = computed(() => logoFor(props.job.company))
</script>
