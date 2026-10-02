<script setup lang="ts">
import { ref } from 'vue'
import { extractTextFromFile } from '@/lib/resumeExtractor'
import { parseResume } from '@/lib/resumeParser'
import type { Resume } from '@/types'

const emit = defineEmits<{
	parsed: [data: { fileName: string; rawText: string; parsed: Resume }]
}>()

const dragging = ref(false)
const selectedFile = ref<File | null>(null)
const parsing = ref(false)
const progress = ref(0)
const statusMessage = ref('Analyzing resume…')
const parseError = ref<string | null>(null)

const ACCEPTED = '.pdf,.docx,.doc,.txt'

const SAMPLE_RESUME_TEXT = `Jordan Rivera
jordan.rivera@example.com | (801) 555-0149 | Provo, UT
https://linkedin.com/in/jordanrivera | https://github.com/jrivera

PROFESSIONAL SUMMARY
Motivated full-stack developer with experience building modern web applications with Vue.js, TypeScript, and Python. Passionate about performant user experiences and intuitive interfaces.

EDUCATION
Brigham Young University
Bachelor of Science in Computer Science
Graduation: April 2027 | GPA: 3.85 / 4.0

EXPERIENCE
Software Engineering Intern | Canyon Labs
May 2025 – August 2025
• Built a real-time reactive dashboard in Vue 3 and TypeScript used by 40+ customer support agents
• Optimized REST API endpoints and SQL queries, cutting p95 response latencies by 35%
• Collaborated in an Agile Scrum team with daily standups and weekly production deployments

Teaching Assistant | BYU Computer Science
September 2024 – Present
• Mentored over 120 undergraduate students in C++, algorithm complexity analysis, and memory management
• Conducted weekly lab sessions and code reviews for data structures coursework

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python, C++, SQL, HTML/CSS
Frameworks & Libraries: Vue.js, React, Node.js, Tailwind CSS, Vite, Vitest
Developer Tools: Git, GitHub, Docker, Linux, AWS, REST APIs, GraphQL, Figma

PROJECTS
Gig Glide: Gamified job hunting platform with Tinder-style swipe decks and automated resume matching
• Built reactive swipe deck in Vue 3 with Tailwind CSS and Pinia state management
• Implemented client-side resume ingestion with PDF text extraction and section parsing

Trailhead: Hiking Trip Planner
• Created an interactive hiking trip planner with offline caching and elevation profile graphs
• Integrated Firebase Auth and Firestore for real-time collaborative route planning

CERTIFICATIONS
AWS Certified Cloud Practitioner`

function onDrop(e: DragEvent) {
	dragging.value = false
	parseError.value = null
	const file = e.dataTransfer?.files[0]
	if (file) selectedFile.value = file
}

function onFileInput(e: Event) {
	parseError.value = null
	const input = e.target as HTMLInputElement
	const file = input.files?.[0]
	if (file) selectedFile.value = file
}

function clearFile() {
	selectedFile.value = null
	parseError.value = null
}

function loadSampleResume() {
	parseError.value = null
	const sampleBlob = new Blob([SAMPLE_RESUME_TEXT], { type: 'text/plain' })
	const sampleFile = new File([sampleBlob], 'Jordan_Rivera_Resume.txt', { type: 'text/plain' })
	selectedFile.value = sampleFile
	proceed()
}

async function proceed() {
	if (!selectedFile.value) return
	parsing.value = true
	parseError.value = null
	progress.value = 10
	statusMessage.value = `Reading ${selectedFile.value.name}…`

	try {
		// Step 1: Smooth progress animation while reading
		const progressTimer = setInterval(() => {
			if (progress.value < 80) {
				progress.value += Math.floor(Math.random() * 12 + 6)
			}
		}, 150)

		// Step 2: Extract text from file (PDF, DOCX, or TXT)
		statusMessage.value = 'Extracting document text…'
		const extracted = await extractTextFromFile(selectedFile.value)
		clearInterval(progressTimer)

		// Step 3: Parse sections & entities
		progress.value = 85
		statusMessage.value = 'Parsing contact, skills & experience…'
		await new Promise((r) => setTimeout(r, 250))

		const parsed = parseResume(extracted.rawText, extracted.fileName)

		// Step 4: Finish progress
		progress.value = 100
		statusMessage.value = 'Resume successfully ingested!'
		await new Promise((r) => setTimeout(r, 350))

		parsing.value = false
		emit('parsed', {
			fileName: extracted.fileName,
			rawText: extracted.rawText,
			parsed,
		})
	} catch (err) {
		console.error('Failed to parse resume:', err)
		parsing.value = false
		parseError.value = 'Could not parse document. Please check the file and try again.'
	}
}

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
	<div class="flex flex-col items-center gap-6">
		<div class="text-center">
			<h2 class="text-xl font-semibold text-neutral-100">Upload Your Resume</h2>
			<p class="mt-1 text-sm text-muted">
				We'll extract and ingest your info so you can review and edit it
			</p>
		</div>

		<!-- Parsing state -->
		<div
			v-if="parsing"
			class="flex w-full flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card/50 p-10"
		>
			<div class="size-12 animate-pulse rounded-xl bg-accent/20 p-2.5">
				<svg
					class="size-full text-accent"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
					<polyline points="14 2 14 8 20 8" />
					<line x1="16" y1="13" x2="8" y2="13" />
					<line x1="16" y1="17" x2="8" y2="17" />
					<polyline points="10 9 9 9 8 9" />
				</svg>
			</div>
			<p class="text-sm font-medium text-neutral-200">{{ statusMessage }}</p>
			<div class="h-1.5 w-full overflow-hidden rounded-full bg-page/60">
				<div
					class="h-full rounded-full bg-accent transition-all duration-300 ease-out"
					:style="{ width: `${progress}%` }"
				/>
			</div>
			<p class="text-xs text-muted">{{ Math.round(progress) }}%</p>
		</div>

		<!-- Drop zone -->
		<label
			v-else-if="!selectedFile"
			id="upload-drop-zone"
			class="group flex w-full cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-10 transition-all duration-200"
			:class="
				dragging
					? 'border-accent bg-accent/5 scale-[1.01]'
					: 'border-border/60 bg-card/30 hover:border-muted/40 hover:bg-card/50'
			"
			@dragover.prevent="dragging = true"
			@dragleave.prevent="dragging = false"
			@drop.prevent="onDrop"
		>
			<div
				class="rounded-xl bg-accent/10 p-3 transition-colors group-hover:bg-accent/15"
			>
				<svg
					class="size-8 text-accent"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
					<polyline points="17 8 12 3 7 8" />
					<line x1="12" y1="3" x2="12" y2="15" />
				</svg>
			</div>
			<div class="text-center">
				<p class="text-sm font-medium text-neutral-200">
					Drag & drop your resume
				</p>
				<p class="mt-0.5 text-xs text-muted">or click to browse</p>
			</div>
			<span
				class="rounded-lg bg-card px-3 py-1.5 text-xs font-medium text-muted transition-colors group-hover:text-neutral-300"
			>
				PDF, DOCX, DOC, or TXT
			</span>
			<input
				type="file"
				:accept="ACCEPTED"
				class="hidden"
				@change="onFileInput"
			/>
		</label>

		<!-- Selected file preview -->
		<div
			v-else
			class="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-4"
		>
			<div class="rounded-xl bg-accent/15 p-2.5">
				<svg
					class="size-6 text-accent"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
					<polyline points="14 2 14 8 20 8" />
				</svg>
			</div>
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-medium text-neutral-100">
					{{ selectedFile.name }}
				</p>
				<p class="text-xs text-muted">{{ formatSize(selectedFile.size) }}</p>
			</div>
			<button
				class="rounded-lg p-1.5 text-muted transition-colors hover:bg-page/40 hover:text-red-400"
				aria-label="Remove file"
				@click="clearFile"
			>
				<svg
					class="size-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
		</div>

		<!-- Error message -->
		<div
			v-if="parseError"
			class="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-xs text-red-300"
		>
			{{ parseError }}
		</div>

		<!-- Continue button -->
		<button
			v-if="selectedFile && !parsing"
			id="upload-continue"
			class="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-page shadow-md shadow-accent/20 transition-all duration-200 hover:bg-accent-soft hover:shadow-accent-soft/25 active:scale-[0.98]"
			@click="proceed"
		>
			Analyze & Ingest Resume
		</button>

		<!-- Demo quick load option -->
		<div v-if="!parsing" class="flex flex-col items-center gap-1.5 pt-2">
			<span class="text-xs text-muted/60">Demo presentation?</span>
			<button
				type="button"
				class="text-xs font-medium text-accent/80 underline decoration-accent/40 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
				@click="loadSampleResume"
			>
				✨ Auto-fill with demo resume (Jordan Rivera)
			</button>
		</div>
	</div>
</template>
