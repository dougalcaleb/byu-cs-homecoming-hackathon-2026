<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useResumeStore } from '@/stores/resume'
import type { Contact, Experience, Education, Project, Resume } from '@/types'

import StepIndicator from '@/components/onboarding/StepIndicator.vue'
import UploadStep from '@/components/onboarding/UploadStep.vue'
import ContactStep from '@/components/onboarding/ContactStep.vue'
import ExperienceStep from '@/components/onboarding/ExperienceStep.vue'
import SkillsStep from '@/components/onboarding/SkillsStep.vue'
import ConfirmStep from '@/components/onboarding/ConfirmStep.vue'

const router = useRouter()
const resumeStore = useResumeStore()

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

// Populate form with mock "parsed" data after upload
function onFileUploaded(file: File) {
	form.fileName = file.name
	form.rawText = `[Parsed content of ${file.name}]`

	// Simulate parsed resume data
	form.contact = {
		name: 'Jane Doe',
		email: 'jane.doe@email.com',
		phone: '(555) 123-4567',
		location: 'Provo, UT',
		links: [
			'https://linkedin.com/in/janedoe',
			'https://github.com/janedoe',
		],
	}
	form.summary =
		'Motivated software developer with experience in full-stack web development and a passion for creating intuitive user experiences.'
	form.skills = [
		'JavaScript',
		'TypeScript',
		'Vue.js',
		'React',
		'Node.js',
		'Python',
		'SQL',
		'Git',
	]
	form.experience = [
		{
			id: crypto.randomUUID(),
			title: 'Software Engineer Intern',
			company: 'Tech Startup',
			location: 'Remote',
			startDate: 'May 2025',
			endDate: 'Aug 2025',
			isCurrent: false,
			bullets: [
				'Built and maintained features using Vue.js and TypeScript',
				'Collaborated with a team of 5 engineers on sprint deliverables',
			],
		},
	]
	form.education = [
		{
			id: crypto.randomUUID(),
			school: 'Brigham Young University',
			degree: 'Bachelor of Science',
			field: 'Computer Science',
			graduationDate: 'April 2027',
			gpa: '3.7',
		},
	]
	form.projects = [
		{
			id: crypto.randomUUID(),
			name: 'Personal Portfolio',
			description: 'A responsive portfolio website',
			technologies: ['Vue.js', 'Tailwind CSS', 'Vite'],
			bullets: ['Designed and built a responsive portfolio from scratch'],
		},
	]
	form.certifications = []

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
	// Build the full Resume object
	const resume: Resume = {
		id: crypto.randomUUID(),
		fileName: form.fileName,
		uploadedAt: new Date().toISOString(),
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
			seniority: 'entry',
		},
	}

	resumeStore.setResume(resume)
	router.push('/')
}
</script>

<template>
	<div
		id="onboarding-screen"
		class="fixed inset-0 flex flex-col bg-page"
	>
		<!-- Top bar -->
		<header class="shrink-0 border-b border-border/50 bg-surface/60 px-6 pb-4 pt-6 backdrop-blur">
			<StepIndicator :steps="STEPS" :current="step" />
		</header>

		<!-- Scrollable content area -->
		<div class="flex-1 overflow-y-auto">
			<div class="mx-auto w-full max-w-md px-6 py-8">
				<Transition name="step" mode="out-in">
					<!-- Step 0: Upload -->
					<UploadStep v-if="step === 0" :key="0" @uploaded="onFileUploaded" />

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
					Save & Start Swiping
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
