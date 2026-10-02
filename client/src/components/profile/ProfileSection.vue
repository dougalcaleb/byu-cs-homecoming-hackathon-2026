<script setup lang="ts">
// One titled card on the profile page, with an Edit link into the matching ingester step
defineProps<{
	title: string
	count?: number
	// Onboarding step that edits this section (1 Contact, 2 Experience, 3 Skills)
	step: number
	// Block within that step to scroll to and highlight (its data-section name)
	focus?: string
}>()
</script>

<template>
	<section class="rise rounded-xl border border-border bg-card p-4">
		<div class="mb-3 flex items-center justify-between">
			<h2
				class="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase"
			>
				{{ title }}
				<span v-if="count" class="text-muted/60">{{ count }}</span>
			</h2>
			<RouterLink
				:to="{ name: 'onboarding', query: { edit: '1', step: String(step), focus } }"
				class="text-xs font-medium text-accent/80 transition-colors hover:text-accent"
				:aria-label="`Edit ${title}`"
			>
				Edit
			</RouterLink>
		</div>
		<slot />
	</section>
</template>
