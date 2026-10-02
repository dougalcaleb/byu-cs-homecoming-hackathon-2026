<script setup lang="ts">
import { computed } from 'vue'
import AddSkillButton from '@/components/improve/AddSkillButton.vue'
import type { Tech } from '@/components/TechStackList.vue'
import type { Gap, LearningResource, ResourceKind } from '@/types'

const props = defineProps<{
	gap: Gap
	tech?: Tech
	resources: LearningResource[]
	open: boolean
	/** Show a + that adds this skill to the profile */
	canAdd?: boolean
	/** The skill is already in the profile */
	added?: boolean
}>()
const emit = defineEmits<{ toggle: []; addSkill: []; removeSkill: [] }>()

const KIND_LABELS: Record<ResourceKind, string> = {
	course: 'Course',
	practice: 'Practice',
	docs: 'Guide',
	video: 'Video',
}

// 24x24 stroke icon path per resource kind
const KIND_ICONS: Record<ResourceKind, string> = {
	course: 'M12 4 2 9l10 5 10-5-10-5Zm-6 7.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5',
	practice: 'm8 8-4 4 4 4m8-8 4 4-4 4m-3-11-2 14',
	docs: 'M12 6.5C10.5 5 8 4.5 4 5v13c4-.5 6.5 0 8 1.5m0-13C13.5 5 16 4.5 20 5v13c-4-.5-6.5 0-8 1.5m0-13v13',
	video: 'M8 5v14l11-7L8 5Z',
}

const name = computed(() => props.gap.skill || props.gap.requirement)
const required = computed(() => props.gap.severity === 'major')
// The first link (hand-picked when there is one) is the suggested starting point
const featured = computed(() => props.resources[0])
const others = computed(() => props.resources.slice(1))
</script>

<template>
	<article
		class="overflow-hidden rounded-xl border border-l-2 border-border bg-card"
		:class="required ? 'border-l-amber-400' : 'border-l-accent'"
	>
		<h3 class="flex items-center">
			<button
				class="flex min-w-0 flex-1 cursor-pointer items-center gap-3 p-3 text-left transition-colors hover:bg-white/5"
				:aria-expanded="open"
				@click="emit('toggle')"
			>
				<span
					class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-page text-sm font-bold text-accent-soft"
				>
					<img
						v-if="tech"
						:src="`https://cdn.simpleicons.org/${tech.icon}/white`"
						alt=""
						class="size-4"
					/>
					<template v-else>{{ name.charAt(0).toUpperCase() }}</template>
				</span>

				<span class="min-w-0 flex-1">
					<span class="block truncate font-medium">{{ name }}</span>
					<span class="block text-xs text-muted">
						{{ resources.length }}
						{{ resources.length === 1 ? 'resource' : 'resources' }}
					</span>
				</span>

				<span
					class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase"
					:class="
						required
							? 'bg-amber-400/15 text-amber-300'
							: 'bg-accent/10 text-accent-soft'
					"
				>
					{{ required ? 'Required' : 'Nice to have' }}
				</span>

				<svg
					class="size-4 shrink-0 text-muted transition-transform duration-300 motion-reduce:transition-none"
					:class="{ 'rotate-180': open }"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="m6 9 6 6 6-6" />
				</svg>
			</button>
			<AddSkillButton v-if="canAdd" class="mr-3 ml-1 shrink-0" :skill="name" :added="!!added" @add="emit('addSkill')" @remove="emit('removeSkill')" />
		</h3>

		<!-- Animates height by transitioning the grid row between 0fr and 1fr -->
		<div
			class="grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none"
			:class="open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
			:inert="!open"
		>
			<div class="overflow-hidden">
				<div class="space-y-3 px-3 pb-3">
					<div v-if="gap.jobQuote">
						<p class="text-[10px] font-semibold tracking-wide text-muted uppercase">
							From the posting
						</p>
						<p class="mt-0.5 text-sm text-neutral-300 italic">
							&ldquo;{{ gap.jobQuote }}&rdquo;
						</p>
					</div>
					<p v-else-if="gap.skill" class="text-sm text-neutral-300">
						{{ gap.requirement }}
					</p>

					<template v-if="featured">
						<a
							:href="featured.url"
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center gap-3 rounded-xl bg-accent px-3 py-2.5 text-page shadow-md shadow-accent/30 transition-all duration-200 hover:scale-[1.01] hover:bg-accent-soft active:scale-[0.99] motion-reduce:transition-none"
						>
							<svg
								class="size-5 shrink-0"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path :d="KIND_ICONS[featured.kind]" />
							</svg>
							<span class="min-w-0 flex-1">
								<span
									class="block text-[10px] font-bold tracking-wide uppercase opacity-70"
								>
									Start here &middot; {{ featured.provider }}
								</span>
								<span class="block truncate text-sm font-semibold">
									{{ featured.title }}
								</span>
							</span>
							<span
								v-if="featured.isFree"
								class="shrink-0 rounded-full bg-page/20 px-2 py-0.5 text-[10px] font-bold uppercase"
							>
								Free
							</span>
							<span class="shrink-0 font-semibold" aria-hidden="true">&nearr;</span>
						</a>

						<ul v-if="others.length" class="flex flex-wrap gap-2">
							<li v-for="resource in others" :key="resource.url">
								<a
									:href="resource.url"
									target="_blank"
									rel="noopener noreferrer"
									:title="resource.title"
									:aria-label="`${resource.title} on ${resource.provider} (${KIND_LABELS[resource.kind]}${resource.isFree ? ', free' : ''})`"
									class="flex items-center gap-1.5 rounded-full border border-border bg-page px-3 py-1.5 text-xs font-medium text-neutral-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent-soft motion-reduce:transition-none"
								>
									<svg
										class="size-3.5 shrink-0 text-accent-soft"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										aria-hidden="true"
									>
										<path :d="KIND_ICONS[resource.kind]" />
									</svg>
									{{ resource.provider }}
									<span
										v-if="resource.isFree"
										class="rounded-full bg-emerald-400/15 px-1.5 text-[10px] font-semibold text-emerald-300"
									>
										Free
									</span>
								</a>
							</li>
						</ul>
					</template>
					<p v-else class="text-sm text-muted">
						This one can't be picked up from a course. If you have related experience,
						make sure your resume says so.
					</p>
				</div>
			</div>
		</div>
	</article>
</template>
