<template>
	<div class="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
		<!-- Left: Resume ("profile") page -->
		<div
			class="order-2 flex flex-1 min-w-0 justify-center overflow-y-auto border-t border-border lg:order-1 lg:justify-end lg:border-t-0 lg:border-r"
		>
			<ProfileView class="w-full max-w-2xl border-x-0 lg:border-l lg:border-r-0" />
		</div>

		<!-- Right: Ways to improve (right aligned) -->
		<div
			class="order-1 flex flex-1 min-w-0 justify-center overflow-y-auto lg:order-2 lg:justify-start"
		>
			<section
				class="w-full max-w-2xl flex-1 bg-surface px-4 py-4 border-x-0 lg:border-r border-border"
			>
				<ImproveContent :job-id="jobId">
					<template #before-title>
						<!-- ?details reopens the job details on the home view instead of the swipe card -->
						<RouterLink
							:to="{ name: 'home', query: { details: jobId } }"
							class="text-sm font-medium text-accent hover:text-accent-soft"
						>
							&larr; Back
						</RouterLink>
					</template>
				</ImproveContent>
			</section>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ImproveContent from '@/components/improve/ImproveContent.vue'
import ProfileView from '@/views/ProfileView.vue'

const route = useRoute()

const jobId = computed(() => String(route.params.jobId))
</script>
