<template>
	<!-- A + that adds a skill to the profile. Once the skill is there it becomes a check (a ✕ on hover), and
		clicking it takes the skill off again. -->
	<button type="button"
		class="group flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors"
		:class="[
			size === 'sm' ? 'size-5' : 'size-7',
			added
				? 'bg-emerald-400/15 text-emerald-300 hover:bg-red-400/20 hover:text-red-300'
				: 'bg-white/10 text-current hover:bg-white/25',
		]"
		:title="added ? `Remove ${skill} from your profile` : `Add ${skill} to your profile`"
		:aria-label="added ? `${skill} is in your profile. Remove it` : `Add ${skill} to your profile`"
		@click="added ? emit('remove') : emit('add')">
		<svg :class="size === 'sm' ? 'size-3' : 'size-4'" viewBox="0 0 24 24" fill="none" stroke="currentColor"
			stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<template v-if="added">
				<path class="group-hover:hidden" d="m5 12.5 4.5 4.5L19 7.5" />
				<path class="hidden group-hover:block" d="m6 6 12 12M18 6 6 18" />
			</template>
			<path v-else d="M12 5v14M5 12h14" />
		</svg>
	</button>
</template>

<script setup lang="ts">
withDefaults(
	defineProps<{
		skill: string
		/** The skill is already in the profile */
		added: boolean
		size?: 'sm' | 'md'
	}>(),
	{ size: 'md' },
)

const emit = defineEmits<{ add: []; remove: [] }>()
</script>
