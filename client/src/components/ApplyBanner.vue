<template>
	<!-- Floats above everything at the bottom of the screen; not a modal, so the page stays usable -->
	<div role="status" aria-live="polite"
		class="rise fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-card p-3 pl-4 shadow-2xl shadow-black/50">
		<template v-if="status !== 'saved'">
			<p class="min-w-0 flex-1 text-sm">
				<span v-if="status === 'failed'" class="text-muted">Could not save that. </span>
				Did you apply to <span class="font-semibold">{{ company }}</span>?
			</p>
			<button class="cursor-pointer shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-sm font-semibold text-page"
				@click="emit('answer', true)">
				Yes, I applied
			</button>
			<button class="cursor-pointer shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-muted hover:text-accent-soft"
				@click="emit('answer', false)">
				Not yet
			</button>
		</template>
		<p v-else class="flex-1 text-sm">
			<span class="font-semibold text-accent">Saved.</span> {{ company }} is marked as applied in your history.
		</p>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	company: string
	/** 'asking' shows the question ('failed' asks again after a save error); 'saved' confirms the answer
	 * (the parent dismisses it shortly after) */
	status: 'asking' | 'failed' | 'saved'
}>()

const emit = defineEmits<{ answer: [applied: boolean] }>()
</script>
