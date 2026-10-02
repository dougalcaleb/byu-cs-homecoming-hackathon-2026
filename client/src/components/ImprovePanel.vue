<template>
	<!-- The deck's side window, shown to the left of the job card after a right swipe. The root is sized by its
		parent. Ways to improve scrolls in the middle; the actions below it stay put. -->
	<div class="flex flex-col">
		<div class="min-h-0 flex-1 overflow-y-auto p-4">
			<ImproveContent :job-id="job.id">
				<template #before-title>
					<div class="flex justify-end">
						<button class="cursor-pointer text-sm text-accent-soft" @click="emit('back')">Back &rsaquo;</button>
					</div>
				</template>
			</ImproveContent>
		</div>

		<!-- Always visible, so the user never has to scroll to find them -->
		<div class="flex shrink-0 flex-wrap gap-2 border-t border-border bg-surface p-4">
			<a v-for="link in job.applyLinks" :key="link.url" :href="link.url" target="_blank" rel="noopener"
				class="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-page" @click="emit('apply')">
				Apply on {{ link.label }}
			</a>
			<!-- Swaps the job card on the right for the user's profile, and back -->
			<button class="cursor-pointer rounded-full border border-accent px-4 py-2 text-sm font-semibold text-accent"
				@click="emit('toggleProfile')">
				{{ profileShown ? 'View job' : 'View profile' }}
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import ImproveContent from '@/components/improve/ImproveContent.vue'
import type { JobPosting } from '@/types'

defineProps<{
	job: JobPosting
	/** Whether the window on the right is showing the profile instead of the job card */
	profileShown: boolean
}>()

// 'apply' fires when an Apply link is clicked; the link still opens the application in a new tab
const emit = defineEmits<{ back: []; apply: []; toggleProfile: [] }>()
</script>
