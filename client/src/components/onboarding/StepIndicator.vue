<script setup lang="ts">
defineProps<{
	steps: string[]
	current: number
}>()
</script>

<template>
	<div class="flex items-center justify-between px-1">
		<template v-for="(step, i) in steps" :key="i">
			<!-- Step circle + label -->
			<div class="flex flex-col items-center gap-1.5">
				<div
					class="flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300"
					:class="{
						'bg-accent text-page shadow-md shadow-accent/30': i === current,
						'bg-accent/20 text-accent': i < current,
						'bg-card text-muted': i > current,
					}"
				>
					<svg
						v-if="i < current"
						class="size-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M5 13l4 4L19 7" />
					</svg>
					<span v-else>{{ i + 1 }}</span>
				</div>
				<span
					class="text-[10px] font-medium transition-colors duration-300"
					:class="i <= current ? 'text-accent-soft' : 'text-muted/50'"
				>
					{{ step }}
				</span>
			</div>

			<!-- Connector line -->
			<div
				v-if="i < steps.length - 1"
				class="mb-5 mx-1 h-px flex-1 transition-colors duration-500"
				:class="i < current ? 'bg-accent/40' : 'bg-border'"
			/>
		</template>
	</div>
</template>
