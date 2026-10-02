<template>
	<section class="mx-auto w-full max-w-2xl flex-1 space-y-4 border-x border-border bg-surface px-4 py-4">
		<header class="space-y-3">
			<div class="flex items-baseline justify-between gap-3">
				<h1 class="text-2xl font-semibold">History</h1>
				<p v-if="entries.length" class="text-sm text-muted">{{ entries.length }} swiped</p>
			</div>

			<!-- Filter -->
			<div v-if="entries.length" class="flex gap-2" role="tablist">
				<button v-for="option in filters" :key="option.value" role="tab" :aria-selected="filter === option.value"
					class="rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
					:class="filter === option.value ? 'bg-accent text-page' : 'bg-card text-muted hover:text-accent-soft'"
					@click="filter = option.value">
					{{ option.label }} <span class="opacity-70">{{ counts[option.value] }}</span>
				</button>
			</div>
		</header>

		<p v-if="loading" class="py-10 text-center text-sm text-muted">Loading your history…</p>

		<div v-else-if="error" class="flex flex-col items-center gap-3 py-10 text-center text-sm text-muted">
			<p>{{ error }}</p>
			<button class="rounded-full bg-accent px-4 py-2 font-semibold text-page" @click="load">Try again</button>
		</div>

		<div v-else-if="!entries.length" class="flex flex-col items-center gap-3 py-10 text-center text-sm text-muted">
			<p>Jobs you swipe on will show up here.</p>
			<RouterLink to="/" class="rounded-full bg-accent px-4 py-2 font-semibold text-page">Start swiping</RouterLink>
		</div>

		<p v-else-if="!visible.length" class="py-10 text-center text-sm text-muted">Nothing here yet.</p>

		<ul v-else class="space-y-2">
			<!-- `rise` is the shared entrance animation; each row starts a little after the one above it -->
			<li v-for="(entry, index) in visible" :key="entry.jobId"
				class="rise flex items-center gap-3 rounded-xl border border-border bg-card p-3"
				:style="{ animationDelay: Math.min(index, MAX_STAGGERED) * STAGGER_MS + 'ms' }">
				<!-- Logo when we have one, otherwise a monogram on the company's gradient -->
				<div class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl"
					:style="{ background: coverBackground(entry.company) }">
					<img v-if="logoFor(entry.company)" :src="logoFor(entry.company)!" :alt="`${entry.company} logo`"
						class="size-full bg-white object-contain p-1.5" />
					<span v-else class="text-lg font-bold text-white">{{ monogram(entry.company) }}</span>
				</div>

				<div class="min-w-0 flex-1">
					<p class="truncate font-semibold">{{ entry.company }}</p>
					<p class="truncate text-sm text-muted">{{ entry.title }}</p>
					<p class="mt-0.5 flex items-center gap-2 text-xs text-muted">
						<span class="font-medium" :class="entry.direction === 'like' ? 'text-accent' : 'text-muted'">
							{{ entry.direction === 'like' ? 'Liked →' : '← Passed' }}
						</span>
						<span aria-hidden="true">·</span>
						<time :datetime="entry.swipedAt" :title="new Date(entry.swipedAt).toLocaleString()">
							{{ ago(entry.swipedAt) }}
						</time>
					</p>
				</div>

				<!-- Opens the job again (the app turns the fragment into that job; see HomeView) -->
				<RouterLink :to="{ path: '/', hash: '#' + entry.jobId }"
					class="shrink-0 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-accent-soft transition-colors hover:bg-accent/10">
					View again
				</RouterLink>
			</li>
		</ul>
	</section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import { fetchHistory } from '@/lib/api'
import { coverBackground, logoFor, prefetchBrand } from '@/lib/brand'
import { monogram } from '@/lib/cover'
import { useAuthStore } from '@/stores/auth'
import type { HistoryEntry } from '@/types'

const authStore = useAuthStore()

const entries = ref<HistoryEntry[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
	const user = authStore.currentEmail
	if (!user) return
	loading.value = true
	error.value = null
	try {
		entries.value = await fetchHistory(user)
	} catch (caught) {
		error.value = caught instanceof Error ? caught.message : 'Could not load history'
	} finally {
		loading.value = false
	}
}

onMounted(load)

// ---------- Filter ----------

type Filter = 'all' | 'like' | 'pass'

const filters: { value: Filter; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'like', label: 'Liked' },
	{ value: 'pass', label: 'Passed' },
]
const filter = ref<Filter>('all')

const counts = computed(() => ({
	all: entries.value.length,
	like: entries.value.filter((entry) => entry.direction === 'like').length,
	pass: entries.value.filter((entry) => entry.direction === 'pass').length,
}))

const visible = computed(() =>
	filter.value === 'all' ? entries.value : entries.value.filter((entry) => entry.direction === filter.value),
)

// ---------- Display ----------

// Rows fade in one after another, like the profile page's cards. Rows past the first MAX_STAGGERED share
// the last delay, so a long history is fully visible within about a second.
const STAGGER_MS = 60
const MAX_STAGGERED = 12

// Look up logos for the companies on screen (cached, so repeats are free)
watchEffect(() => {
	for (const entry of entries.value) prefetchBrand({ company: entry.company })
})

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	['year', 31_536_000],
	['month', 2_592_000],
	['day', 86_400],
	['hour', 3_600],
	['minute', 60],
]

function ago(iso: string) {
	const seconds = (Date.parse(iso) - Date.now()) / 1000
	for (const [unit, size] of UNITS) {
		if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit)
	}
	return 'just now'
}
</script>
