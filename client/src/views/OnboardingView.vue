<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResumeStore } from '@/stores/resume'
import { useAuthStore } from '@/stores/auth'
import type { Contact, Experience, Education, Project, Resume } from '@/types'

import StepIndicator from '@/components/onboarding/StepIndicator.vue'
import UploadStep from '@/components/onboarding/UploadStep.vue'
import ContactStep from '@/components/onboarding/ContactStep.vue'
import ExperienceStep from '@/components/onboarding/ExperienceStep.vue'
import SkillsStep from '@/components/onboarding/SkillsStep.vue'
import ConfirmStep from '@/components/onboarding/ConfirmStep.vue'

const route = useRoute()
const router = useRouter()
const resumeStore = useResumeStore()

// Edit mode (?edit=1, optional &step=0..4): opened from the profile page with the saved
// resume pre-filled, and saves back to it instead of creating a new one
const existing = route.query.edit ? resumeStore.current : null
const editing = existing !== null
// A new file uploaded while editing replaces the saved resume rather than updating it
let replacedFile = false

const STEPS = ['Upload', 'Contact', 'Experience', 'Skills', 'Confirm']
const step = ref(0)

const form = reactive({
	fileName: '',
	rawText: '',
	contact: {
		name: '',
		email: '',
		phone: '',
		location: '',
		links: [],
	} as Contact,
	summary: '',
	skills: [] as string[],
	experience: [] as Experience[],
	education: [] as Education[],
	projects: [] as Project[],
	certifications: [] as string[],
})

// Copy a resume into the form (copies, so edits don't touch the saved resume until Save)
function fillForm(resume: Resume) {
	form.fileName = resume.fileName
	form.rawText = resume.rawText

	form.contact = {
		name: resume.contact.name || '',
		email: resume.contact.email || '',
		phone: resume.contact.phone || '',
		location: resume.contact.location || '',
		links: [...resume.contact.links],
	}

	form.summary = resume.summary || ''
	form.skills = [...resume.skills]

	form.experience = resume.experience.map((e) => ({
		...e,
		bullets: e.bullets.length ? [...e.bullets] : [''],
	}))

	form.education = resume.education.map((e) => ({ ...e }))

	form.projects = resume.projects.map((p) => ({
		...p,
		technologies: [...p.technologies],
		bullets: p.bullets.length ? [...p.bullets] : [''],
	}))

	form.certifications = [...resume.certifications]
}

if (existing) {
	fillForm(existing)
	const requested = Number(route.query.step)
	step.value = Number.isInteger(requested) && requested >= 0 && requested < STEPS.length ? requested : 1
}

// A profile Edit link can name the block it came for (?focus=skills, ?focus=phone):
// scroll to it and flash a highlight (the .section-focus style in main.css)
const FOCUS_HIGHLIGHT_MS = 2500

onMounted(async () => {
	const focus = editing && typeof route.query.focus === 'string' ? route.query.focus : ''
	if (!/^[a-z]+$/.test(focus)) return
	await nextTick()

	// Sections carry data-section; contact fields are found by their input id
	const input = document.getElementById(`contact-${focus}`)
	const target = document.querySelector(`[data-section="${focus}"]`) ?? input?.parentElement
	if (!target) return

	target.scrollIntoView({ block: 'center' })
	target.classList.add('section-focus')
	setTimeout(() => target.classList.remove('section-focus'), FOCUS_HIGHLIGHT_MS)
	input?.focus({ preventScroll: true })
})

// Populate form with real ingested & parsed data after upload
function onFileParsed(data: { fileName: string; rawText: string; parsed: Resume }) {
	fillForm(data.parsed)
	replacedFile = true
	step.value = 1
}

function goToStep(target: number) {
	step.value = target
}

function next() {
	if (step.value < STEPS.length - 1) step.value++
}

function back() {
	if (step.value > 0) step.value--
}

function finish() {
	// Editing without a new upload updates the saved resume in place
	const kept = existing && !replacedFile ? existing : null

	// Build the full Resume object
	const resume: Resume = {
		id: kept?.id ?? crypto.randomUUID(),
		fileName: form.fileName || 'uploaded-resume.pdf',
		uploadedAt: kept?.uploadedAt ?? new Date().toISOString(),
		rawText: form.rawText,
		contact: { ...form.contact, links: [...form.contact.links] },
		summary: form.summary || undefined,
		skills: [...form.skills],
		experience: form.experience.map((e) => ({ ...e, bullets: [...e.bullets] })),
		education: form.education.map((e) => ({ ...e })),
		projects: form.projects.map((p) => ({
			...p,
			technologies: [...p.technologies],
			bullets: [...p.bullets],
		})),
		certifications: [...form.certifications],
		searchProfile: {
			titles: form.experience.map((e) => e.title).filter(Boolean),
			keywords: [...form.skills.slice(0, 10)],
			location: form.contact.location,
			seniority: kept?.searchProfile.seniority ?? 'entry',
			remotePreference: kept?.searchProfile.remotePreference,
		},
	}

	resumeStore.setResume(resume)

	const auth = useAuthStore()
	if (!auth.isAuthenticated) {
		auth.signup(form.contact.email || 'demo@gigglide.com', 'demo-password')
	}

	router.push(editing ? '/profile' : '/')
}
</script>

<template>
	<div
		id="onboarding-screen"
		class="fixed inset-0 flex flex-col bg-page"
	>
		<!-- Top bar -->
		<header class="shrink-0 border-b border-border/50 bg-surface/60 px-6 pb-4 pt-6 backdrop-blur">
			<!-- Edit mode: leave without saving -->
			<div v-if="editing" class="mx-auto mb-4 flex w-full max-w-md items-center justify-between">
				<span class="text-sm font-semibold text-neutral-100">Edit profile</span>
				<RouterLink
					to="/profile"
					class="text-sm font-medium text-muted transition-colors hover:text-neutral-200"
				>
					Cancel
				</RouterLink>
			</div>
			<StepIndicator :steps="STEPS" :current="step" />
		</header>

		<!-- Scrollable content area -->
		<div class="flex-1 overflow-y-auto">
			<div class="mx-auto w-full max-w-md px-6 py-8">
				<Transition name="step" mode="out-in">
					<!-- Step 0: Upload -->
					<UploadStep v-if="step === 0" :key="0" @parsed="onFileParsed" />

					<!-- Step 1: Contact -->
					<ContactStep v-else-if="step === 1" :key="1" :contact="form.contact" />

					<!-- Step 2: Experience & Education -->
					<ExperienceStep
						v-else-if="step === 2"
						:key="2"
						:experience="form.experience"
						:education="form.education"
					/>

					<!-- Step 3: Skills, Projects, Certs, Summary -->
					<SkillsStep
						v-else-if="step === 3"
						:key="3"
						:skills="form.skills"
						:projects="form.projects"
						:certifications="form.certifications"
						:summary="form.summary"
						@update:summary="form.summary = $event"
					/>

					<!-- Step 4: Confirm -->
					<ConfirmStep
						v-else-if="step === 4"
						:key="4"
						:file-name="form.fileName"
						:contact="form.contact"
						:summary="form.summary"
						:skills="form.skills"
						:experience="form.experience"
						:education="form.education"
						:projects="form.projects"
						:certifications="form.certifications"
						@go-to-step="goToStep"
					/>
				</Transition>
			</div>
		</div>

		<!-- Bottom nav buttons -->
		<footer
			v-if="step > 0"
			class="shrink-0 border-t border-border/50 bg-surface/60 px-6 py-4 backdrop-blur"
		>
			<div class="mx-auto flex w-full max-w-md gap-3">
				<button
					class="flex-1 rounded-xl border border-border/60 bg-card py-3 text-sm font-medium text-muted transition-colors hover:border-muted/40 hover:text-neutral-200"
					@click="back"
				>
					Back
				</button>
				<button
					v-if="step < STEPS.length - 1"
					class="flex-1 rounded-xl bg-accent py-3 text-sm font-semibold text-page shadow-md shadow-accent/20 transition-all hover:bg-accent-soft hover:shadow-accent-soft/25 active:scale-[0.98]"
					@click="next"
				>
					Next
				</button>
				<button
					v-else
					id="onboarding-finish"
					class="flex-1 rounded-xl bg-accent py-3 text-sm font-semibold text-page shadow-md shadow-accent/20 transition-all hover:bg-accent-soft hover:shadow-accent-soft/25 active:scale-[0.98]"
					@click="finish"
				>
					{{ editing ? 'Save changes' : 'Save & Start Swiping' }}
				</button>
			</div>
		</footer>
	</div>
</template>

<style scoped>
.step-enter-active {
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.step-leave-active {
	transition: all 0.15s ease;
}
.step-enter-from {
	opacity: 0;
	transform: translateX(20px);
}
.step-leave-to {
	opacity: 0;
	transform: translateX(-20px);
}
</style>
