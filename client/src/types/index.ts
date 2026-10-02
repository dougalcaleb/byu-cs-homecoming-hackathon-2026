// Shared data contracts. Every feature (resume parsing, job fetch, swipe deck, match view)
// reads and writes these shapes, so change them here first and tell the team.

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

export interface JobPosting {
	// Provider job id; key for dedupe, swipes and analyses
	id: string
	title: string
	company: string
	location?: string
	isRemote?: boolean
	description: string
	highlights: JobHighlights
	employmentType?: string
	// Display strings as returned by the provider ("$90K–$120K a year", "3 days ago")
	salary?: string
	postedAt?: string
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

export interface Gap {
	id: string
	requirement: string
	jobQuote?: string
	severity: 'minor' | 'major'
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
