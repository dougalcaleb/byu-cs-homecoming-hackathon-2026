<script setup lang="ts">
import type { Experience, Education } from '@/types'

const props = defineProps<{
	experience: Experience[]
	education: Education[]
}>()

// ─── Experience helpers ───

function addExperience() {
	props.experience.push({
		id: crypto.randomUUID(),
		title: '',
		company: '',
		location: '',
		startDate: '',
		endDate: '',
		isCurrent: false,
		bullets: [''],
	})
}

function removeExperience(index: number) {
	props.experience.splice(index, 1)
}

function addBullet(exp: Experience) {
	exp.bullets.push('')
}

function removeBullet(exp: Experience, bIndex: number) {
	exp.bullets.splice(bIndex, 1)
}

// ─── Education helpers ───

function addEducation() {
	props.education.push({
		id: crypto.randomUUID(),
		school: '',
		degree: '',
		field: '',
		graduationDate: '',
		gpa: '',
	})
}

function removeEducation(index: number) {
	props.education.splice(index, 1)
}
</script>

<template>
	<div class="flex flex-col gap-8">
		<!-- Experience section -->
		<div>
			<div class="mb-4 flex items-center justify-between">
				<div>
					<h2 class="text-xl font-semibold text-neutral-100">Experience</h2>
					<p class="mt-0.5 text-sm text-muted">Your work history</p>
				</div>
				<button
					class="rounded-lg bg-card px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-border"
					@click="addExperience"
				>
					+ Add
				</button>
			</div>

			<div class="flex flex-col gap-4">
				<div
					v-for="(exp, i) in experience"
					:key="exp.id"
					class="rounded-xl border border-border/50 bg-card/30 p-4"
				>
					<div class="mb-3 flex items-start justify-between">
						<span class="text-xs font-medium text-muted">Position {{ i + 1 }}</span>
						<button
							v-if="experience.length > 1"
							class="rounded p-1 text-muted transition-colors hover:text-red-400"
							aria-label="Remove experience"
							@click="removeExperience(i)"
						>
							<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>

					<div class="flex flex-col gap-3">
						<div class="grid grid-cols-2 gap-3">
							<input
								v-model="exp.title"
								placeholder="Job Title"
								class="w-full rounded-lg border border-border/50 bg-page/40 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/40 focus:border-accent"
							/>
							<input
								v-model="exp.company"
								placeholder="Company"
								class="w-full rounded-lg border border-border/50 bg-page/40 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/40 focus:border-accent"
							/>
						</div>

						<div class="grid grid-cols-3 gap-3">
							<input
								v-model="exp.startDate"
								placeholder="Start"
								class="w-full rounded-lg border border-border/50 bg-page/40 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/40 focus:border-accent"
							/>
							<input
								v-model="exp.endDate"
								placeholder="End"
								:disabled="exp.isCurrent"
								class="w-full rounded-lg border border-border/50 bg-page/40 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/40 focus:border-accent disabled:opacity-40"
							/>
							<label class="flex items-center gap-1.5 text-xs text-muted">
								<input
									v-model="exp.isCurrent"
									type="checkbox"
									class="size-3.5 rounded border-border accent-accent"
								/>
								Current
							</label>
						</div>

						<!-- Bullets -->
						<div>
							<div class="mb-1.5 flex items-center justify-between">
								<span class="text-xs text-muted">Key accomplishments</span>
								<button
									class="text-xs text-accent/70 transition-colors hover:text-accent"
									@click="addBullet(exp)"
								>
									+ bullet
								</button>
							</div>
							<div class="flex flex-col gap-1.5">
								<div
									v-for="(_, bI) in exp.bullets"
									:key="bI"
									class="flex gap-1.5"
								>
									<span class="mt-2.5 text-xs text-muted/40">•</span>
									<input
										v-model="exp.bullets[bI]"
										placeholder="Describe what you did…"
										class="min-w-0 flex-1 rounded-lg border border-border/40 bg-page/30 px-3 py-2 text-xs text-neutral-200 outline-none transition-colors placeholder:text-muted/30 focus:border-accent/60"
									/>
									<button
										v-if="exp.bullets.length > 1"
										class="mt-1 shrink-0 rounded p-1 text-muted/40 transition-colors hover:text-red-400"
										@click="removeBullet(exp, bI)"
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
					v-if="experience.length === 0"
					class="rounded-xl border-2 border-dashed border-border/40 py-6 text-sm text-muted transition-colors hover:border-accent/40 hover:text-accent"
					@click="addExperience"
				>
					+ Add your first position
				</button>
			</div>
		</div>

		<!-- Education section -->
		<div>
			<div class="mb-4 flex items-center justify-between">
				<div>
					<h2 class="text-xl font-semibold text-neutral-100">Education</h2>
					<p class="mt-0.5 text-sm text-muted">Schools and degrees</p>
				</div>
				<button
					class="rounded-lg bg-card px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-border"
					@click="addEducation"
				>
					+ Add
				</button>
			</div>

			<div class="flex flex-col gap-4">
				<div
					v-for="(edu, i) in education"
					:key="edu.id"
					class="rounded-xl border border-border/50 bg-card/30 p-4"
				>
					<div class="mb-3 flex items-start justify-between">
						<span class="text-xs font-medium text-muted">School {{ i + 1 }}</span>
						<button
							class="rounded p-1 text-muted transition-colors hover:text-red-400"
							aria-label="Remove education"
							@click="removeEducation(i)"
						>
							<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>

					<div class="flex flex-col gap-3">
						<input
							v-model="edu.school"
							placeholder="School Name"
							class="w-full rounded-lg border border-border/50 bg-page/40 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/40 focus:border-accent"
						/>
						<div class="grid grid-cols-2 gap-3">
							<input
								v-model="edu.degree"
								placeholder="Degree (B.S., M.S., …)"
								class="w-full rounded-lg border border-border/50 bg-page/40 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/40 focus:border-accent"
							/>
							<input
								v-model="edu.field"
								placeholder="Field of Study"
								class="w-full rounded-lg border border-border/50 bg-page/40 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/40 focus:border-accent"
							/>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<input
								v-model="edu.graduationDate"
								placeholder="Graduation Date"
								class="w-full rounded-lg border border-border/50 bg-page/40 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/40 focus:border-accent"
							/>
							<input
								v-model="edu.gpa"
								placeholder="GPA (optional)"
								class="w-full rounded-lg border border-border/50 bg-page/40 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/40 focus:border-accent"
							/>
						</div>
					</div>
				</div>

				<button
					v-if="education.length === 0"
					class="rounded-xl border-2 border-dashed border-border/40 py-6 text-sm text-muted transition-colors hover:border-accent/40 hover:text-accent"
					@click="addEducation"
				>
					+ Add your first school
				</button>
			</div>
		</div>
	</div>
</template>
