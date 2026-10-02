// Shared data contracts for client and server. Every feature (resume parsing, job fetch,
// swipe deck, match view) reads and writes these shapes, so change them here first and tell
// the team. Types only: the client imports this file with `export type`, so no runtime code.

export type AsyncState<T> =
	| { status: 'idle' }
	| { status: 'loading' }
	| { status: 'ready'; data: T }
	| { status: 'error'; error: string }

// ---------- Resume ----------

export interface Contact {
	name?: string
	email?: string
	phone?: string
	location?: string
	links: string[]
}

export interface Experience {
	id: string
	title: string
	company: string
	location?: string
	// Dates stay as written on the resume ("2024-05", "May 2024", "Present")
	startDate?: string
	endDate?: string
	isCurrent: boolean
	bullets: string[]
}

export interface Education {
	id: string
	school: string
	degree?: string
	field?: string
	graduationDate?: string
	gpa?: string
}

export interface Project {
	id: string
	name: string
	description?: string
	technologies: string[]
	bullets: string[]
}

export type Seniority = 'intern' | 'entry' | 'mid' | 'senior'
export type RemotePreference = 'remote' | 'hybrid' | 'onsite'

// Derived from the resume; the only part the job fetcher needs
export interface SearchProfile {
	titles: string[]
	keywords: string[]
	location?: string
	seniority?: Seniority
	remotePreference?: RemotePreference
}

export interface Resume {
	id: string
	fileName: string
	uploadedAt: string
	// Verbatim extracted text. Highlights are anchored to substrings of this, so never reformat it.
	rawText: string
	contact: Contact
	summary?: string
	skills: string[]
	experience: Experience[]
	education: Education[]
	projects: Project[]
	certifications: string[]
	searchProfile: SearchProfile
}

// ---------- Job posting ----------

export interface JobHighlights {
	qualifications: string[]
	responsibilities: string[]
	benefits: string[]
}

export interface ApplyLink {
	label: string
	url: string
}

// Where a posting came from. ATS boards are fetched per company; the rest are search APIs.
export type JobProvider = 'greenhouse' | 'lever' | 'ashby' | 'serpapi' | 'jsearch' | 'mock'

export interface JobPosting {
	// `${provider}:${providerId}`; key for dedupe, swipes and analyses
	id: string
	provider: JobProvider
	title: string
	company: string
	location?: string
	workplace?: RemotePreference
	department?: string
	// Plain text (HTML stripped). Highlights are anchored to substrings of this.
	description: string
	highlights: JobHighlights
	employmentType?: string
	// Display string as returned by the provider ("$90K–$120K a year")
	salary?: string
	// ISO 8601; approximate when the provider only says "3 days ago"
	postedAt?: string
	// Job board the posting was found on ("LinkedIn"); unset for company career sites
	source?: string
	companyLogoUrl?: string
	applyLinks: ApplyLink[]
}

// ---------- Swipe ----------

export type SwipeDirection = 'like' | 'pass'

export interface Swipe {
	jobId: string
	direction: SwipeDirection
	swipedAt: string
}

// ---------- Match analysis ----------

export type HighlightKind = 'skill' | 'experience' | 'education' | 'keyword'

export interface Highlight {
	id: string
	// Exact substring of Resume.rawText
	resumeQuote: string
	// Exact substring of JobPosting.description
	jobQuote?: string
	kind: HighlightKind
	reason: string
}

// Decides which learning sites are worth linking. 'credential' covers things a course
// cannot fix (a degree, years of experience, a clearance).
export type GapCategory =
	| 'language'
	| 'framework'
	| 'tool'
	| 'concept'
	| 'algorithms'
	| 'soft-skill'
	| 'credential'

export interface Gap {
	id: string
	// Short searchable name ("Tableau", "Unit testing"); used to build learning links
	skill: string
	category?: GapCategory
	requirement: string
	jobQuote?: string
	// 'major' = the posting requires it, 'minor' = nice to have
	severity: 'minor' | 'major'
}

export type ResourceKind = 'course' | 'practice' | 'docs' | 'video'

// An external link that teaches a gap's skill. URLs are always built by our code
// (see client/src/lib/learningResources.ts), never taken from LLM output.
export interface LearningResource {
	provider: string
	title: string
	url: string
	kind: ResourceKind
	isFree: boolean
}

export type TipCategory = 'wording' | 'missing-skill' | 'quantify' | 'format' | 'keyword'

export interface Tip {
	id: string
	category: TipCategory
	text: string
	resumeQuote?: string
	suggestedRewrite?: string
}

export interface MatchAnalysis {
	jobId: string
	resumeId: string
	// 0–100
	score: number
	summary: string
	highlights: Highlight[]
	gaps: Gap[]
	tips: Tip[]
	generatedAt: string
}

// ---------- API ----------

// POST /api/jobs/candidates
export interface CandidatesRequest {
	profile: SearchProfile
	// Job ids to leave out, e.g. ones already swiped
	exclude?: string[]
	limit?: number
}

export interface CandidatesResponse {
	jobs: JobPosting[]
}
