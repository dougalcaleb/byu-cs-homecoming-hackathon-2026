<template>
	<!-- Same surface column as Ways to Improve -->
	<section
		class="mx-auto w-full max-w-2xl flex-1 space-y-4 border-x border-border bg-surface px-4 py-4"
	>
		<header class="flex items-center justify-between gap-3">
			<h1 class="text-2xl font-semibold">Profile</h1>
			<RouterLink
				v-if="resume"
				:to="editLink(1)"
				class="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-page shadow-md shadow-accent/30 transition-all duration-200 hover:scale-[1.03] hover:bg-accent-soft active:scale-[0.97] motion-reduce:transition-none"
			>
				<svg
					class="size-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M4 20h4L19 9l-4-4L4 16v4Zm9.5-13.5 4 4" />
				</svg>
				Edit profile
			</RouterLink>
		</header>

		<!-- No resume yet -->
		<div
			v-if="!resume"
			class="rise flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center"
		>
			<p class="font-medium">No resume on file yet</p>
			<p class="text-sm text-muted">Upload one and we'll build your profile from it.</p>
			<RouterLink
				:to="{ name: 'onboarding' }"
				class="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-page shadow-md shadow-accent/30 transition-colors hover:bg-accent-soft"
			>
				Upload resume
			</RouterLink>
		</div>

		<template v-else>
			<!-- Who you are -->
			<div class="rise rounded-2xl border border-border bg-card p-4">
				<div class="flex items-center gap-4">
					<div
						class="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-bold text-page shadow-lg shadow-accent/30"
						aria-hidden="true"
					>
						{{ initials }}
					</div>
					<div class="min-w-0">
						<p class="truncate text-xl leading-tight font-semibold">
							{{ resume.contact.name || 'Your name' }}
						</p>
						<p v-if="headline" class="truncate text-sm text-accent-soft">
							{{ headline }}
						</p>
						<p v-if="resume.contact.location" class="text-sm text-muted">
							{{ resume.contact.location }}
						</p>
					</div>
				</div>

				<ul v-if="contactChips.length" class="mt-4 flex flex-wrap gap-1.5">
					<li v-for="chip in contactChips" :key="chip.text" class="min-w-0">
						<component
							:is="chip.href ? 'a' : 'span'"
							:href="chip.href"
							:target="chip.external ? '_blank' : undefined"
							:rel="chip.external ? 'noopener noreferrer' : undefined"
							class="flex items-center gap-1.5 rounded-full border border-border bg-page px-3 py-1 text-xs font-medium text-neutral-200"
							:class="
								chip.href &&
								'transition-colors hover:border-accent hover:text-accent-soft'
							"
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
								<path :d="CHIP_ICONS[chip.kind]" />
							</svg>
							<span class="truncate">{{ chip.text }}</span>
						</component>
					</li>
				</ul>
			</div>

			<!-- Profile strength: how complete the profile is, and what to add -->
			<div
				class="rise flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
				style="animation-delay: 60ms"
			>
				<ScoreRing :score="strength" label="Profile strength" />
				<div class="min-w-0">
					<p class="font-semibold">Profile strength</p>
					<p v-if="missing.length === 0" class="mt-0.5 text-sm text-muted">
						Your profile is complete.
					</p>
					<template v-else>
						<p class="mt-0.5 text-sm text-muted">Add these to stand out:</p>
						<ul class="mt-2 flex flex-wrap gap-1.5">
							<li v-for="item in missing" :key="item.label">
								<RouterLink
									:to="editLink(item.step, item.focus)"
									class="block rounded-full bg-amber-400/15 px-3 py-1 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-400/25"
								>
									+ {{ item.label }}
								</RouterLink>
							</li>
						</ul>
					</template>
				</div>
			</div>

			<ProfileSection
				v-if="resume.summary"
				title="Summary"
				focus="summary"
				:step="3"
				style="animation-delay: 120ms"
			>
				<p class="text-sm leading-relaxed text-neutral-300">{{ resume.summary }}</p>
			</ProfileSection>

			<ProfileSection
				v-if="skills.length"
				title="Skills"
				focus="skills"
				:count="skills.length"
				:step="3"
				style="animation-delay: 180ms"
			>
				<ul class="flex flex-wrap gap-1.5">
					<li
						v-for="skill in skills"
						:key="skill.name"
						class="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent-soft"
					>
						<img
							v-if="skill.tech"
							:src="`https://cdn.simpleicons.org/${skill.tech.icon}/white`"
							alt=""
							class="size-3"
						/>
						{{ skill.name }}
					</li>
				</ul>
			</ProfileSection>

			<ProfileSection
				v-if="resume.experience.length"
				title="Experience"
				focus="experience"
				:count="resume.experience.length"
				:step="2"
				style="animation-delay: 240ms"
			>
				<!-- Timeline: the list's left border is the line, each role hangs a dot on it -->
				<ol class="ml-1.5 space-y-5 border-l border-border pl-5">
					<li v-for="exp in resume.experience" :key="exp.id" class="relative">
						<span
							class="absolute top-1.5 -left-[25.5px] size-2.5 rounded-full ring-4 ring-card"
							:class="
								exp.isCurrent
									? 'bg-accent shadow-[0_0_8px_var(--color-accent)]'
									: 'bg-muted/50'
							"
						/>
						<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
							<p class="font-medium">{{ exp.title || 'Untitled role' }}</p>
							<span
								v-if="exp.isCurrent"
								class="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-accent-soft uppercase"
							>
								Current
							</span>
						</div>
						<p class="text-sm text-muted">
							{{
								[exp.company, exp.location, dateRange(exp)]
									.filter(Boolean)
									.join(' · ')
							}}
						</p>
						<ul
							v-if="filled(exp.bullets).length"
							class="mt-2 list-disc space-y-1 pl-4 text-sm text-neutral-300 marker:text-muted/50"
						>
							<li v-for="(bullet, index) in filled(exp.bullets)" :key="index">
								{{ bullet }}
							</li>
						</ul>
					</li>
				</ol>
			</ProfileSection>

			<ProfileSection
				v-if="resume.education.length"
				title="Education"
				focus="education"
				:count="resume.education.length"
				:step="2"
				style="animation-delay: 300ms"
			>
				<ul class="space-y-3">
					<li v-for="edu in resume.education" :key="edu.id">
						<p class="font-medium">{{ edu.school || 'Unnamed school' }}</p>
						<p class="text-sm text-muted">
							{{
								[
									[edu.degree, edu.field].filter(Boolean).join(' in '),
									edu.graduationDate,
									edu.gpa && `GPA ${edu.gpa}`,
								]
									.filter(Boolean)
									.join(' · ')
							}}
						</p>
					</li>
				</ul>
			</ProfileSection>

			<ProfileSection
				v-if="resume.projects.length"
				title="Projects"
				focus="projects"
				:count="resume.projects.length"
				:step="3"
				style="animation-delay: 360ms"
			>
				<ul class="space-y-3">
					<li
						v-for="project in projects"
						:key="project.id"
						class="rounded-lg border border-border bg-page p-3"
					>
						<p class="font-medium">{{ project.name || 'Untitled project' }}</p>
						<p
							v-if="project.description"
							class="mt-0.5 text-sm whitespace-pre-line text-muted"
						>
							{{ project.description }}
						</p>
						<ul v-if="project.technologies.length" class="mt-2 flex flex-wrap gap-1">
							<li
								v-for="tech in project.technologies"
								:key="tech"
								class="rounded-full bg-card px-2 py-0.5 text-[10px] font-medium text-neutral-300"
							>
								{{ tech }}
							</li>
						</ul>
						<ul
							v-if="project.bullets.length"
							class="mt-2 list-disc space-y-1 pl-4 text-sm text-neutral-300 marker:text-muted/50"
						>
							<li v-for="(bullet, index) in project.bullets" :key="index">
								{{ bullet }}
							</li>
						</ul>
					</li>
				</ul>
			</ProfileSection>

			<ProfileSection
				v-if="resume.certifications.length"
				title="Certifications"
				focus="certifications"
				:count="resume.certifications.length"
				:step="3"
				style="animation-delay: 420ms"
			>
				<ul class="flex flex-wrap gap-1.5">
					<li
						v-for="cert in resume.certifications"
						:key="cert"
						class="rounded-full border border-border bg-page px-3 py-1 text-xs font-medium text-neutral-200"
					>
						{{ cert }}
					</li>
				</ul>
			</ProfileSection>

			<p class="px-1 pb-2 text-xs text-muted">
				From {{ resume.fileName }} &middot; uploaded {{ uploadedOn }} &middot;
				<RouterLink :to="editLink(0)" class="text-accent/80 hover:text-accent">
					Upload a new resume
				</RouterLink>
			</p>
		</template>
	</section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ScoreRing from '@/components/improve/ScoreRing.vue'
import ProfileSection from '@/components/profile/ProfileSection.vue'
import { findTech } from '@/lib/techStack'
import { useResumeStore } from '@/stores/resume'
import type { Experience } from '@/types'

type ChipKind = 'email' | 'phone' | 'link'

// 24x24 stroke icon path per contact chip kind
const CHIP_ICONS: Record<ChipKind, string> = {
	email: 'M4 6h16v12H4V6Zm0 1 8 6 8-6',
	phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z',
	link: 'M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.3l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
}

const resumeStore = useResumeStore()
const resume = computed(() => resumeStore.current)

// Reopens the resume ingester pre-filled with the saved resume, on the given step;
// `focus` names the block or contact field to scroll to and highlight there
function editLink(step: number, focus?: string) {
	return { name: 'onboarding', query: { edit: '1', step: String(step), focus } }
}

const initials = computed(() => {
	const words = (resume.value?.contact.name ?? '').trim().split(/\s+/).filter(Boolean)
	const letters = [words[0], words.length > 1 ? words[words.length - 1] : undefined]
		.map((word) => word?.charAt(0) ?? '')
		.join('')
	return letters.toUpperCase() || '?'
})

// Current role if there is one, otherwise the first listed
const headline = computed(() => {
	const roles = resume.value?.experience ?? []
	const role = roles.find((exp) => exp.isCurrent) ?? roles[0]
	return role ? [role.title, role.company].filter(Boolean).join(' at ') : ''
})

// Only http(s) links become clickable; anything else is shown as plain text
function toHref(link: string): string | undefined {
	try {
		const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(link) ? link : `https://${link}`)
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined
	} catch {
		return undefined
	}
}

const contactChips = computed(() => {
	const contact = resume.value?.contact
	if (!contact) return []
	const chips: { kind: ChipKind; text: string; href?: string; external?: boolean }[] = []
	if (contact.email)
		chips.push({ kind: 'email', text: contact.email, href: `mailto:${contact.email}` })
	if (contact.phone)
		chips.push({
			kind: 'phone',
			text: contact.phone,
			href: `tel:${contact.phone.replace(/[^\d+]/g, '')}`,
		})
	for (const link of contact.links) {
		const href = toHref(link)
		chips.push({
			kind: 'link',
			text: link.replace(/^https?:\/\/(www\.)?/i, ''),
			href,
			external: href !== undefined,
		})
	}
	return chips
})

const skills = computed(() =>
	(resume.value?.skills ?? []).map((name) => ({ name, tech: findTech(name) })),
)

// The ingester stores '' placeholders for bullets left blank
function filled(bullets: string[]) {
	return bullets.filter((bullet) => bullet.trim())
}

// The parser fills a project's description from its bullets (joined by newlines) when the
// resume has none, and its bullets from the description when it has no bullets. Show that
// text once: as bullets in the first case, as the description in the second.
const projects = computed(() =>
	(resume.value?.projects ?? []).map((project) => {
		const bullets = filled(project.bullets).map((bullet) => bullet.trim())
		const description = project.description?.trim() || undefined
		if (description && bullets.join('\n') === description) {
			return bullets.length > 1
				? { ...project, description: undefined, bullets }
				: { ...project, description, bullets: [] }
		}
		return { ...project, description, bullets }
	}),
)

function dateRange(exp: Experience) {
	const end = exp.isCurrent ? 'Present' : exp.endDate
	return [exp.startDate, end].filter(Boolean).join(' – ')
}

// Completeness checklist; `step` is the ingester step where each item is filled in
const checklist = computed(() => {
	const data = resume.value
	if (!data) return []
	return [
		{ label: 'Name', step: 1, focus: 'name', done: Boolean(data.contact.name) },
		{ label: 'Email', step: 1, focus: 'email', done: Boolean(data.contact.email) },
		{ label: 'Phone', step: 1, focus: 'phone', done: Boolean(data.contact.phone) },
		{ label: 'Location', step: 1, focus: 'location', done: Boolean(data.contact.location) },
		{ label: 'Summary', step: 3, focus: 'summary', done: Boolean(data.summary) },
		{ label: 'Skills', step: 3, focus: 'skills', done: data.skills.length > 0 },
		{ label: 'Experience', step: 2, focus: 'experience', done: data.experience.length > 0 },
		{ label: 'Education', step: 2, focus: 'education', done: data.education.length > 0 },
		{ label: 'Projects', step: 3, focus: 'projects', done: data.projects.length > 0 },
	]
})

const missing = computed(() => checklist.value.filter((item) => !item.done))

const strength = computed(() => {
	const total = checklist.value.length
	return total ? Math.round(((total - missing.value.length) / total) * 100) : 0
})

const uploadedOn = computed(() => {
	const date = new Date(resume.value?.uploadedAt ?? '')
	return Number.isNaN(date.getTime())
		? 'recently'
		: date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
})
</script>
