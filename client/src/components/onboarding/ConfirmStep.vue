<script setup lang="ts">
import type { Contact, Experience, Education, Project } from '@/types'

defineProps<{
	fileName: string
	contact: Contact
	summary: string
	skills: string[]
	experience: Experience[]
	education: Education[]
	projects: Project[]
	certifications: string[]
}>()

const emit = defineEmits<{ goToStep: [step: number] }>()
</script>

<template>
	<div class="flex flex-col gap-6">
		<div class="text-center">
			<h2 class="text-xl font-semibold text-neutral-100">Review Your Profile</h2>
			<p class="mt-1 text-sm text-muted">
				Make sure everything looks good before saving
			</p>
		</div>

		<!-- File -->
		<div class="rounded-xl border border-border/50 bg-card/30 p-4">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-muted">Source File</span>
				<button
					class="text-xs text-accent/70 transition-colors hover:text-accent"
					@click="emit('goToStep', 0)"
				>
					Change
				</button>
			</div>
			<p class="mt-1 text-sm text-neutral-200">{{ fileName }}</p>
		</div>

		<!-- Contact -->
		<div class="rounded-xl border border-border/50 bg-card/30 p-4">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-muted">Contact</span>
				<button
					class="text-xs text-accent/70 transition-colors hover:text-accent"
					@click="emit('goToStep', 1)"
				>
					Edit
				</button>
			</div>
			<div class="mt-2 flex flex-col gap-1 text-sm text-neutral-200">
				<p v-if="contact.name" class="font-medium text-neutral-100">
					{{ contact.name }}
				</p>
				<p v-if="contact.email">{{ contact.email }}</p>
				<p v-if="contact.phone">{{ contact.phone }}</p>
				<p v-if="contact.location" class="text-muted">{{ contact.location }}</p>
				<div v-if="contact.links.length" class="mt-1 flex flex-wrap gap-1.5">
					<span
						v-for="(link, i) in contact.links"
						:key="i"
						class="truncate rounded-full bg-page/50 px-2.5 py-0.5 text-xs text-accent-soft"
					>
						{{ link }}
					</span>
				</div>
			</div>
		</div>

		<!-- Summary -->
		<div v-if="summary" class="rounded-xl border border-border/50 bg-card/30 p-4">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-muted">Summary</span>
				<button
					class="text-xs text-accent/70 transition-colors hover:text-accent"
					@click="emit('goToStep', 3)"
				>
					Edit
				</button>
			</div>
			<p class="mt-2 text-sm leading-relaxed text-neutral-300">{{ summary }}</p>
		</div>

		<!-- Experience -->
		<div v-if="experience.length" class="rounded-xl border border-border/50 bg-card/30 p-4">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-muted">
					Experience ({{ experience.length }})
				</span>
				<button
					class="text-xs text-accent/70 transition-colors hover:text-accent"
					@click="emit('goToStep', 2)"
				>
					Edit
				</button>
			</div>
			<div class="mt-2 flex flex-col gap-3">
				<div v-for="exp in experience" :key="exp.id">
					<p class="text-sm font-medium text-neutral-100">
						{{ exp.title || 'Untitled' }}
					</p>
					<p class="text-xs text-muted">
						{{ exp.company }}
						<template v-if="exp.startDate">
							· {{ exp.startDate }} – {{ exp.isCurrent ? 'Present' : exp.endDate }}
						</template>
					</p>
					<ul
						v-if="exp.bullets.filter(Boolean).length"
						class="mt-1.5 flex flex-col gap-1 pl-3 text-xs text-neutral-300"
					>
						<li
							v-for="(b, bIdx) in exp.bullets.filter(Boolean)"
							:key="bIdx"
							class="list-disc leading-relaxed"
						>
							{{ b }}
						</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Education -->
		<div v-if="education.length" class="rounded-xl border border-border/50 bg-card/30 p-4">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-muted">
					Education ({{ education.length }})
				</span>
				<button
					class="text-xs text-accent/70 transition-colors hover:text-accent"
					@click="emit('goToStep', 2)"
				>
					Edit
				</button>
			</div>
			<div class="mt-2 flex flex-col gap-2">
				<div v-for="edu in education" :key="edu.id">
					<p class="text-sm font-medium text-neutral-100">{{ edu.school }}</p>
					<p class="text-xs text-muted">
						{{ [edu.degree, edu.field].filter(Boolean).join(' in ') }}
						<template v-if="edu.graduationDate"> · {{ edu.graduationDate }}</template>
					</p>
				</div>
			</div>
		</div>

		<!-- Skills -->
		<div v-if="skills.length" class="rounded-xl border border-border/50 bg-card/30 p-4">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-muted">Skills</span>
				<button
					class="text-xs text-accent/70 transition-colors hover:text-accent"
					@click="emit('goToStep', 3)"
				>
					Edit
				</button>
			</div>
			<div class="mt-2 flex flex-wrap gap-1.5">
				<span
					v-for="(skill, i) in skills"
					:key="i"
					class="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent-soft"
				>
					{{ skill }}
				</span>
			</div>
		</div>

		<!-- Projects -->
		<div v-if="projects.length" class="rounded-xl border border-border/50 bg-card/30 p-4">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-muted">
					Projects ({{ projects.length }})
				</span>
				<button
					class="text-xs text-accent/70 transition-colors hover:text-accent"
					@click="emit('goToStep', 3)"
				>
					Edit
				</button>
			</div>
			<div class="mt-2 flex flex-col gap-3">
				<div v-for="proj in projects" :key="proj.id">
					<div class="flex items-baseline justify-between gap-2">
						<p class="text-sm font-medium text-neutral-100">{{ proj.name }}</p>
						<span
							v-if="proj.technologies.length"
							class="text-[10px] text-accent/70"
						>
							{{ proj.technologies.join(', ') }}
						</span>
					</div>
					<p v-if="proj.description" class="mt-0.5 text-xs text-muted leading-relaxed">
						{{ proj.description }}
					</p>
					<ul
						v-if="proj.bullets.filter(Boolean).length"
						class="mt-1 flex flex-col gap-0.5 pl-3 text-xs text-neutral-300"
					>
						<li
							v-for="(b, bIdx) in proj.bullets.filter(Boolean)"
							:key="bIdx"
							class="list-disc leading-relaxed"
						>
							{{ b }}
						</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Certifications -->
		<div
			v-if="certifications.length"
			class="rounded-xl border border-border/50 bg-card/30 p-4"
		>
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-muted">Certifications</span>
				<button
					class="text-xs text-accent/70 transition-colors hover:text-accent"
					@click="emit('goToStep', 3)"
				>
					Edit
				</button>
			</div>
			<div class="mt-2 flex flex-wrap gap-1.5">
				<span
					v-for="(cert, i) in certifications"
					:key="i"
					class="rounded-full bg-card px-2.5 py-0.5 text-xs font-medium text-neutral-300"
				>
					{{ cert }}
				</span>
			</div>
		</div>
	</div>
</template>
