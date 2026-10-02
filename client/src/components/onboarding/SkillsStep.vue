<script setup lang="ts">
import { ref } from 'vue'
import type { Project } from '@/types'

const props = defineProps<{
	skills: string[]
	projects: Project[]
	certifications: string[]
	summary: string
}>()

const emit = defineEmits<{ 'update:summary': [value: string] }>()

// ─── Skills ───

const newSkill = ref('')

function addSkill() {
	const skill = newSkill.value.trim()
	if (skill && !props.skills.includes(skill)) {
		props.skills.push(skill)
	}
	newSkill.value = ''
}

function removeSkill(index: number) {
	props.skills.splice(index, 1)
}

// ─── Certifications ───

const newCert = ref('')

function addCert() {
	const cert = newCert.value.trim()
	if (cert && !props.certifications.includes(cert)) {
		props.certifications.push(cert)
	}
	newCert.value = ''
}

function removeCert(index: number) {
	props.certifications.splice(index, 1)
}

// ─── Projects ───

function addProject() {
	props.projects.push({
		id: crypto.randomUUID(),
		name: '',
		description: '',
		technologies: [],
		bullets: [''],
	})
}

function removeProject(index: number) {
	props.projects.splice(index, 1)
}

function addProjectBullet(proj: Project) {
	proj.bullets.push('')
}

function removeProjectBullet(proj: Project, bIndex: number) {
	proj.bullets.splice(bIndex, 1)
}

// Tech tags within a project
const newProjectTech = ref<Record<string, string>>({})

function addProjectTech(proj: Project) {
	const tech = (newProjectTech.value[proj.id] ?? '').trim()
	if (tech && !proj.technologies.includes(tech)) {
		proj.technologies.push(tech)
	}
	newProjectTech.value[proj.id] = ''
}

function removeProjectTech(proj: Project, index: number) {
	proj.technologies.splice(index, 1)
}
</script>

<template>
	<div class="flex flex-col gap-8">
		<!-- Summary (data-section lets the profile page's Edit links scroll to and highlight a block) -->
		<div data-section="summary">
			<h2 class="text-xl font-semibold text-neutral-100">Summary</h2>
			<p class="mt-0.5 mb-3 text-sm text-muted">Brief professional summary</p>
			<textarea
				:value="summary"
				placeholder="Experienced software developer with a focus on…"
				rows="3"
				class="w-full resize-none rounded-xl border border-border/60 bg-page/40 px-4 py-3 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/40 focus:border-accent focus:ring-1 focus:ring-accent/50"
				@input="emit('update:summary', ($event.target as HTMLTextAreaElement).value)"
			/>
		</div>

		<!-- Skills -->
		<div data-section="skills">
			<h2 class="text-xl font-semibold text-neutral-100">Skills</h2>
			<p class="mt-0.5 mb-3 text-sm text-muted">Technical and soft skills</p>

			<div v-if="skills.length" class="mb-3 flex flex-wrap gap-1.5">
				<span
					v-for="(skill, i) in skills"
					:key="i"
					class="group flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent-soft"
				>
					{{ skill }}
					<button
						class="rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
						@click="removeSkill(i)"
					>
						<svg class="size-3 text-accent/60 hover:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</span>
			</div>
			<div class="flex gap-2">
				<input
					v-model="newSkill"
					type="text"
					placeholder="Add a skill…"
					class="min-w-0 flex-1 rounded-xl border border-border/60 bg-page/40 px-4 py-2.5 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/40 focus:border-accent"
					@keydown.enter.prevent="addSkill"
				/>
				<button
					class="shrink-0 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-border hover:text-neutral-200"
					@click="addSkill"
				>
					Add
				</button>
			</div>
		</div>

		<!-- Projects -->
		<div data-section="projects">
			<div class="mb-3 flex items-center justify-between">
				<div>
					<h2 class="text-xl font-semibold text-neutral-100">Projects</h2>
					<p class="mt-0.5 text-sm text-muted">Side projects & portfolio pieces</p>
				</div>
				<button
					class="rounded-lg bg-card px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-border"
					@click="addProject"
				>
					+ Add
				</button>
			</div>

			<div class="flex flex-col gap-4">
				<div
					v-for="(proj, i) in projects"
					:key="proj.id"
					class="rounded-xl border border-border/50 bg-card/30 p-4"
				>
					<div class="mb-3 flex items-start justify-between">
						<span class="text-xs font-medium text-muted">Project {{ i + 1 }}</span>
						<button
							class="rounded p-1 text-muted transition-colors hover:text-red-400"
							@click="removeProject(i)"
						>
							<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>

					<div class="flex flex-col gap-3">
						<input
							v-model="proj.name"
							placeholder="Project Name"
							class="w-full rounded-lg border border-border/50 bg-page/40 px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-muted/40 focus:border-accent"
						/>
						<textarea
							v-model="proj.description"
							placeholder="Brief description…"
							rows="2"
							class="w-full resize-none rounded-lg border border-border/50 bg-page/40 px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-muted/40 focus:border-accent"
						/>

						<!-- Technologies -->
						<div>
							<span class="mb-1 block text-xs text-muted">Technologies</span>
							<div v-if="proj.technologies.length" class="mb-1.5 flex flex-wrap gap-1">
								<span
									v-for="(tech, tI) in proj.technologies"
									:key="tI"
									class="flex items-center gap-1 rounded-full bg-page/50 px-2 py-0.5 text-[10px] font-medium text-muted"
								>
									{{ tech }}
									<button class="hover:text-red-400" @click="removeProjectTech(proj, tI)">
										<svg class="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
											<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
										</svg>
									</button>
								</span>
							</div>
							<input
								v-model="newProjectTech[proj.id]"
								placeholder="Add tech…"
								class="w-full rounded-lg border border-border/40 bg-page/30 px-3 py-1.5 text-xs text-neutral-200 outline-none placeholder:text-muted/30 focus:border-accent/60"
								@keydown.enter.prevent="addProjectTech(proj)"
							/>
						</div>

						<!-- Bullets -->
						<div>
							<div class="mb-1 flex items-center justify-between">
								<span class="text-xs text-muted">Details</span>
								<button
									class="text-xs text-accent/70 hover:text-accent"
									@click="addProjectBullet(proj)"
								>
									+ bullet
								</button>
							</div>
							<div class="flex flex-col gap-1.5">
								<div v-for="(_, bI) in proj.bullets" :key="bI" class="flex gap-1.5">
									<span class="mt-2 text-xs text-muted/40">•</span>
									<textarea
										v-model="proj.bullets[bI]"
										placeholder="Describe accomplishment or feature…"
										rows="2"
										class="min-w-0 flex-1 resize-y rounded-lg border border-border/40 bg-page/30 px-3 py-1.5 text-xs text-neutral-200 outline-none placeholder:text-muted/30 focus:border-accent/60"
									/>
									<button
										v-if="proj.bullets.length > 1"
										class="mt-1 shrink-0 rounded p-1 text-muted/40 hover:text-red-400"
										@click="removeProjectBullet(proj, bI)"
									>
										<svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
										</svg>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				<button
					v-if="projects.length === 0"
					class="rounded-xl border-2 border-dashed border-border/40 py-6 text-sm text-muted transition-colors hover:border-accent/40 hover:text-accent"
					@click="addProject"
				>
					+ Add a project
				</button>
			</div>
		</div>

		<!-- Certifications -->
		<div data-section="certifications">
			<h2 class="text-xl font-semibold text-neutral-100">Certifications</h2>
			<p class="mt-0.5 mb-3 text-sm text-muted">Professional certifications</p>

			<div v-if="certifications.length" class="mb-3 flex flex-wrap gap-1.5">
				<span
					v-for="(cert, i) in certifications"
					:key="i"
					class="group flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs font-medium text-neutral-300"
				>
					{{ cert }}
					<button
						class="rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
						@click="removeCert(i)"
					>
						<svg class="size-3 text-muted hover:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</span>
			</div>
			<div class="flex gap-2">
				<input
					v-model="newCert"
					type="text"
					placeholder="Add a certification…"
					class="min-w-0 flex-1 rounded-xl border border-border/60 bg-page/40 px-4 py-2.5 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/40 focus:border-accent"
					@keydown.enter.prevent="addCert"
				/>
				<button
					class="shrink-0 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-border hover:text-neutral-200"
					@click="addCert"
				>
					Add
				</button>
			</div>
		</div>
	</div>
</template>
