import type {
	Contact,
	Experience,
	Education,
	Project,
	Resume,
	SearchProfile,
	Seniority,
} from '@/types'

// Curated list of recognizable tech skills to cross-reference
const TECH_DICTIONARY: { name: string; pattern: RegExp }[] = [
	{ name: 'TypeScript', pattern: /\btypescript\b/i },
	{ name: 'JavaScript', pattern: /\bjavascript\b/i },
	{ name: 'Vue.js', pattern: /\bvue(\.js)?\b/i },
	{ name: 'React', pattern: /\breact(\.js)?\b/i },
	{ name: 'Next.js', pattern: /\bnext(\.js)?\b/i },
	{ name: 'Nuxt.js', pattern: /\bnuxt(\.js)?\b/i },
	{ name: 'Angular', pattern: /\bangular\b/i },
	{ name: 'Svelte', pattern: /\bsvelte\b/i },
	{ name: 'Node.js', pattern: /\bnode(\.js)?\b/i },
	{ name: 'Python', pattern: /\bpython\b/i },
	{ name: 'Java', pattern: /\bjava\b/i },
	{ name: 'C++', pattern: /\bc\+\+\b/i },
	{ name: 'C#', pattern: /\bc#|\bc-sharp\b/i },
	{ name: 'Go', pattern: /\bgolang|\bgo\b/i },
	{ name: 'Rust', pattern: /\brust\b/i },
	{ name: 'Swift', pattern: /\bswift\b/i },
	{ name: 'Kotlin', pattern: /\bkotlin\b/i },
	{ name: 'PHP', pattern: /\bphp\b/i },
	{ name: 'Ruby', pattern: /\bruby\b/i },
	{ name: 'SQL', pattern: /\b(sql|mysql|postgresql|sqlite)\b/i },
	{ name: 'PostgreSQL', pattern: /\bpostgres(ql)?\b/i },
	{ name: 'MongoDB', pattern: /\bmongodb|mongo\b/i },
	{ name: 'Redis', pattern: /\bredis\b/i },
	{ name: 'Docker', pattern: /\bdocker\b/i },
	{ name: 'Kubernetes', pattern: /\bkubernetes|k8s\b/i },
	{ name: 'AWS', pattern: /\baws|amazon web services\b/i },
	{ name: 'Google Cloud', pattern: /\bgcp|google cloud\b/i },
	{ name: 'Azure', pattern: /\bazure\b/i },
	{ name: 'Git', pattern: /\bgit\b/i },
	{ name: 'GitHub', pattern: /\bgithub\b/i },
	{ name: 'GraphQL', pattern: /\bgraphql\b/i },
	{ name: 'REST APIs', pattern: /\brest(ful)?\s*apis?|\brest\b/i },
	{ name: 'Tailwind CSS', pattern: /\btailwind(\s*css)?\b/i },
	{ name: 'HTML/CSS', pattern: /\bhtml5?(\s*\/\s*css3?)?|\bcss3?\b/i },
	{ name: 'Linux', pattern: /\blinux\b/i },
	{ name: 'Figma', pattern: /\bfigma\b/i },
	{ name: 'CI/CD', pattern: /\bci\s*\/\s*cd\b/i },
	{ name: 'Vitest', pattern: /\bvitest\b/i },
	{ name: 'Jest', pattern: /\bjest\b/i },
	{ name: 'PyTorch', pattern: /\bpytorch\b/i },
	{ name: 'TensorFlow', pattern: /\btensorflow\b/i },
	{ name: 'FastAPI', pattern: /\bfastapi\b/i },
	{ name: 'Django', pattern: /\bdjango\b/i },
	{ name: 'Flask', pattern: /\bflask\b/i },
	{ name: 'Spring Boot', pattern: /\bspring(\s*boot)?\b/i },
]

/**
 * Parses raw extracted resume text into structured Contact, Experience,
 * Education, Skills, and Projects.
 */
export function parseResume(rawText: string, fileName: string): Resume {
	const lines = rawText
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter((l) => l.length > 0)

	const contact = extractContact(lines, rawText, fileName)
	const sections = splitSections(rawText)

	const summary = extractSummary(sections, lines)
	const skills = extractSkills(sections, rawText)
	const experience = extractExperience(sections)
	const education = extractEducation(sections)
	const projects = extractProjects(sections)
	const certifications = extractCertifications(sections)

	// Determine seniority
	let seniority: Seniority = 'entry'
	const allTextLower = rawText.toLowerCase()
	if (allTextLower.includes('intern') || education.some((e) => !e.graduationDate || e.graduationDate.includes('2026') || e.graduationDate.includes('2027') || e.graduationDate.includes('2028'))) {
		seniority = 'intern'
	} else if (experience.length >= 4 || allTextLower.includes('senior') || allTextLower.includes('lead engineer')) {
		seniority = 'senior'
	} else if (experience.length >= 2) {
		seniority = 'mid'
	}

	const searchProfile: SearchProfile = {
		titles: experience.map((e) => e.title).filter(Boolean),
		keywords: skills.slice(0, 10),
		location: contact.location,
		seniority,
	}

	return {
		id: crypto.randomUUID(),
		fileName,
		uploadedAt: new Date().toISOString(),
		rawText,
		contact,
		summary: summary || undefined,
		skills,
		experience,
		education,
		projects,
		certifications,
		searchProfile,
	}
}

// ─── Contact Extraction ───

function extractContact(lines: string[], rawText: string, fileName: string): Contact {
	// 1. Email
	const emailMatch = rawText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/)
	const email = emailMatch ? emailMatch[0] : ''

	// 2. Phone
	const phoneMatch = rawText.match(/(?:\+?1[-.\s]*)?(?:\([0-9]{3}\)|[0-9]{3})[-.\s]*[0-9]{3}[-.\s]*[0-9]{4}/)
	const phone = phoneMatch ? phoneMatch[0] : ''

	// 3. Location (e.g. "Provo, UT", "Salt Lake City, UT", "San Francisco, CA")
	const locationMatch = rawText.match(/\b([A-Z][a-zA-Z\s.-]+),\s*([A-Z]{2})\b/)
	const location = locationMatch ? `${locationMatch[1]?.trim()}, ${locationMatch[2]}` : ''

	// 4. Links (LinkedIn, GitHub, Portfolios)
	const links: string[] = []
	const urlRegex = /(?:https?:\/\/)?(?:www\.)?(github\.com\/[A-Za-z0-9_.-]+|linkedin\.com\/in\/[A-Za-z0-9_.-]+|[a-zA-Z0-9-]+\.(?:dev|io|me|portfolio|org)(?:\/[^\s,)]*)?)/gi
	let linkMatch: RegExpExecArray | null
	while ((linkMatch = urlRegex.exec(rawText)) !== null) {
		const matchStr = linkMatch[0]
		if (
			matchStr &&
			!matchStr.includes('@') &&
			(!email || !email.includes(matchStr))
		) {
			const fullUrl = matchStr.startsWith('http') ? matchStr : `https://${matchStr}`
			if (!links.includes(fullUrl)) {
				links.push(fullUrl)
			}
		}
	}

	// 5. Name
	let name = ''
	const headerLines = lines.slice(0, 5)
	for (const line of headerLines) {
		const clean = line.replace(/[^a-zA-Z\s.-]/g, '').trim()
		const words = clean.split(/\s+/).filter(Boolean)
		// Usually 2-4 words, capitalized, not "Resume" or "Curriculum Vitae"
		if (
			words.length >= 2 &&
			words.length <= 4 &&
			!/resume|curriculum|vitae|portfolio|page|developer|engineer|contact/i.test(clean) &&
			!clean.includes('@')
		) {
			name = clean
			break
		}
	}

	// Fallback name from filename (e.g. "jordan-rivera-resume.pdf" -> "Jordan Rivera")
	if (!name) {
		const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]?(resume|cv)[-_]?/gi, '')
		const parts = baseName.split(/[-_\s]+/).filter(Boolean)
		if (parts.length >= 2) {
			name = parts.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
		} else if (parts.length === 1 && parts[0]) {
			name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase()
		}
	}

	return {
		name: name || undefined,
		email: email || undefined,
		phone: phone || undefined,
		location: location || undefined,
		links,
	}
}

// ─── Section Splitting ───

interface Sections {
	summary: string[]
	experience: string[]
	education: string[]
	skills: string[]
	projects: string[]
	certifications: string[]
	other: string[]
}

const SECTION_HEADERS: { key: keyof Sections; pattern: RegExp }[] = [
	{
		key: 'summary',
		pattern: /^(summary|professional\s+summary|profile|about\s*me|objective)$/i,
	},
	{
		key: 'experience',
		pattern: /^(experience|work\s+experience|professional\s+experience|employment\s+history|work\s+history)$/i,
	},
	{
		key: 'education',
		pattern: /^(education|academic\s+background|education\s+&\s+credentials|academics)$/i,
	},
	{
		key: 'skills',
		pattern: /^(skills|technical\s+skills|core\s+competencies|technologies|tools\s+&\s+technologies|skills\s+&\s+tools)$/i,
	},
	{
		key: 'projects',
		pattern: /^(projects|personal\s+projects|technical\s+projects|academic\s+projects|key\s+projects)$/i,
	},
	{
		key: 'certifications',
		pattern: /^(certifications|certificates|licenses|credentials)$/i,
	},
]

function splitSections(rawText: string): Sections {
	const sections: Sections = {
		summary: [],
		experience: [],
		education: [],
		skills: [],
		projects: [],
		certifications: [],
		other: [],
	}

	const rawLines = rawText.split(/\r?\n/).map((l) => l.trim())
	let currentSection: keyof Sections | null = null

	for (const line of rawLines) {
		if (!line) continue

		// Check if line is a section header
		const cleanedHeader = line.replace(/[:\-–—#*=_]+$/, '').trim()
		const matched = SECTION_HEADERS.find((sh) => sh.pattern.test(cleanedHeader))

		if (matched) {
			currentSection = matched.key
			continue
		}

		if (currentSection) {
			sections[currentSection].push(line)
		} else {
			sections.other.push(line)
		}
	}

	return sections
}

// ─── Summary Extraction ───

function extractSummary(sections: Sections, lines: string[]): string {
	if (sections.summary.length > 0) {
		return sections.summary.join(' ')
	}
	// If no explicit summary header, check if there is a 1-3 line introductory paragraph
	// right after the contact lines and before the first major section header
	const introCandidates: string[] = []
	for (let i = 2; i < Math.min(lines.length, 8); i++) {
		const line = lines[i]
		if (line && line.length > 30 && !SECTION_HEADERS.some((sh) => sh.pattern.test(line))) {
			introCandidates.push(line)
		}
	}
	return introCandidates.join(' ')
}

// ─── Skills Extraction ───

function extractSkills(sections: Sections, rawText: string): string[] {
	const skillSet = new Set<string>()

	// 1. Check explicit skills section
	if (sections.skills.length > 0) {
		for (const line of sections.skills) {
			// Remove headers like "Languages:", "Frameworks:", etc.
			const content = line.replace(/^[A-Za-z\s]+:\s*/, '')
			const tokens = content.split(/[,•|·/;\n]+/).map((s) => s.trim()).filter((s) => s.length > 0)
			for (const token of tokens) {
				if (token.length <= 35 && !/skills|proficient/i.test(token)) {
					skillSet.add(token)
				}
			}
		}
	}

	// 2. Cross-reference with technology dictionary against entire resume
	for (const tech of TECH_DICTIONARY) {
		if (tech.pattern.test(rawText)) {
			// Find existing case-insensitive match or add formatted name
			let exists = false
			for (const existing of skillSet) {
				if (existing.toLowerCase() === tech.name.toLowerCase()) {
					exists = true
					break
				}
			}
			if (!exists) {
				skillSet.add(tech.name)
			}
		}
	}

	return Array.from(skillSet)
}

// ─── Bullet & Project Parsing Helpers ───

const BULLET_START_REGEX =
	/^[•\u2022\u2023\u25cf\u25cb\u25aa\u25a0\u2013\u2014\u2219\u00b7\uf0b7\uf0a7\u25e6*+\->~▪▫◦○●]\s*/

const NUMBERED_BULLET_REGEX = /^(?:\d+[.)]|\([0-9a-zA-Z]\))\s*/

const ACTION_VERBS =
	/^(?:built|developed|engineered|designed|implemented|created|led|managed|collaborated|wrote|optimized|maintained|researched|assisted|spearheaded|automated|integrated|deployed|configured|architected|resolved|reduced|increased|improved|refactored|directed|oversaw|analyzed|coordinated|delivered|mentored|tested|debugged|facilitated|produced|evaluated|scheduled|trained|programmed|scaled|authored|conducted|established|launched|utilized|demonstrated|supported|achieved|provided)\b/i

function isBulletLeader(line: string): boolean {
	return BULLET_START_REGEX.test(line) || NUMBERED_BULLET_REGEX.test(line)
}

function stripBulletLeader(line: string): string {
	return line
		.replace(BULLET_START_REGEX, '')
		.replace(NUMBERED_BULLET_REGEX, '')
		.trim()
}

function isProjectTitleLine(line: string, currentProj: Partial<Project> | null): boolean {
	const trimmed = line.trim()
	if (!trimmed) return false

	// If it starts with a bullet leader, it is NEVER a project title
	if (isBulletLeader(trimmed)) return false

	// If it starts with an action verb, it is an accomplishment bullet, NOT a project title
	if (ACTION_VERBS.test(trimmed)) return false

	// If it ends with period/semicolon and is a long sentence, it is a description/bullet, NOT a title
	if (/[.;]$/.test(trimmed) && trimmed.length > 50) return false

	// If no project started yet, this must be the title of the first project
	if (!currentProj) return true

	// If line has common project separators (| or — or [tech] or (tech))
	if (/[|—]/.test(trimmed) || /\s-\s/.test(trimmed) || /\([^)]+\)|\[[^\]]+\]/.test(trimmed)) {
		return true
	}

	// If line is short (< 45 chars), does NOT end with sentence punctuation, and looks like a title
	if (trimmed.length < 45 && !/[.!?;,]$/.test(trimmed)) {
		const words = trimmed.split(/\s+/)
		if (words.length <= 6) {
			return true
		}
	}

	return false
}

// ─── Experience Extraction ───

const DATE_REGEX =
	/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|(?:Spring|Summer|Fall|Winter)\s+\d{4}|\d{1,2}\/\d{4}|\b20\d{2}\b)\s*(?:-|–|—|to)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|(?:Spring|Summer|Fall|Winter)\s+\d{4}|\d{1,2}\/\d{4}|\b20\d{2}\b|Present|Current)/i

function extractExperience(sections: Sections): Experience[] {
	const expLines = sections.experience
	if (expLines.length === 0) return []

	const entries: Experience[] = []
	let currentEntry: Partial<Experience> | null = null
	let currentBullets: string[] = []

	function commitEntry() {
		if (currentEntry && (currentEntry.title || currentEntry.company)) {
			const cleanBullets = currentBullets.map((b) => b.trim()).filter((b) => b.length > 0)
			entries.push({
				id: crypto.randomUUID(),
				title: currentEntry.title || 'Software Developer',
				company: currentEntry.company || 'Company',
				location: currentEntry.location,
				startDate: currentEntry.startDate,
				endDate: currentEntry.endDate,
				isCurrent: currentEntry.isCurrent ?? false,
				bullets: cleanBullets.length ? cleanBullets : [''],
			})
		}
		currentEntry = null
		currentBullets = []
	}

	for (let i = 0; i < expLines.length; i++) {
		const line = (expLines[i] ?? '').trim()
		if (!line) continue

		const dateMatch = line.match(DATE_REGEX)

		if (dateMatch) {
			// If we were already in an entry, save it
			commitEntry()

			const dateStr = dateMatch[0]
			const dateParts = dateStr.split(/\s*(?:-|–|—|to)\s*/i)
			const startDate = dateParts[0]?.trim()
			const endDate = dateParts[1]?.trim()
			const isCurrent = /present|current/i.test(endDate || '')

			// Clean line without date
			const lineWithoutDate = line.replace(DATE_REGEX, '').trim()

			// Check title and company
			let title = ''
			let company = ''

			// If previous line or current line has title / company
			const candidateLine =
				lineWithoutDate.length > 2
					? lineWithoutDate
					: i > 0 &&
						  expLines[i - 1] &&
						  !expLines[i - 1]?.match(DATE_REGEX) &&
						  !isBulletLeader(expLines[i - 1] ?? '')
						? (expLines[i - 1]?.trim() ?? '')
						: ''

			if (candidateLine.includes('|')) {
				const parts = candidateLine.split('|').map((p) => p.trim())
				title = parts[0] || ''
				company = parts[1] || ''
			} else if (candidateLine.includes('—') || candidateLine.includes(' - ')) {
				const parts = candidateLine.split(/—|\s-\s/).map((p) => p.trim())
				title = parts[0] || ''
				company = parts[1] || ''
			} else if (candidateLine.includes(',')) {
				const parts = candidateLine.split(',').map((p) => p.trim())
				title = parts[0] || ''
				company = parts[1] || ''
			} else if (candidateLine.length > 0) {
				title = candidateLine
			}

			// If company is still empty, look at adjacent line
			if (
				!company &&
				i > 0 &&
				expLines[i - 1] &&
				expLines[i - 1] !== candidateLine &&
				!expLines[i - 1]?.match(DATE_REGEX) &&
				!isBulletLeader(expLines[i - 1] ?? '')
			) {
				company = expLines[i - 1]?.trim() || ''
			}

			currentEntry = {
				title: title || 'Software Engineer',
				company: company || 'Organization',
				startDate,
				endDate,
				isCurrent,
			}
			continue
		}

		if (!currentEntry) continue

		const isExplicitBullet = isBulletLeader(line)
		const cleaned = stripBulletLeader(line)
		if (!cleaned) continue

		if (isExplicitBullet || currentBullets.length === 0) {
			currentBullets.push(cleaned)
		} else {
			const lastIdx = currentBullets.length - 1
			const lastBullet = currentBullets[lastIdx] ?? ''
			const endsWithPunct = /[.!?;:]$/.test(lastBullet.trim())
			const startsWithVerb = ACTION_VERBS.test(cleaned)
			const startsWithCap = /^[A-Z]/.test(cleaned)

			if ((endsWithPunct && startsWithCap) || startsWithVerb) {
				currentBullets.push(cleaned)
			} else {
				currentBullets[lastIdx] = `${lastBullet} ${cleaned}`.trim()
			}
		}
	}

	commitEntry()
	return entries
}

// ─── Education Extraction ───

function extractEducation(sections: Sections): Education[] {
	const eduLines = sections.education
	if (eduLines.length === 0) return []

	const entries: Education[] = []
	let school = ''
	let degree = ''
	let field = 'Computer Science'
	let graduationDate: string | undefined
	let gpa: string | undefined

	for (const line of eduLines) {
		// School line
		if (/(?:University|College|Institute|Academy|BYU|School)/i.test(line) && !school) {
			school = line.split(/[|•—–]/)[0]?.trim() || line.trim()
		}

		// Degree line
		const degMatch = line.match(
			/(Bachelor\s+(?:of\s+[A-Za-z]+)?|Master\s+(?:of\s+[A-Za-z]+)?|BS|BA|MS|MA|B\.S\.|B\.A\.|M\.S\.|Associate|Ph\.D\.|Doctor)/i,
		)
		if (degMatch && !degree) {
			degree = degMatch[0].trim()
			// Extract field from same line if present, e.g. "Bachelor of Science in Computer Science"
			const fieldMatch = line.match(
				/(?:in|of)\s+([A-Za-z\s]+(?:Science|Engineering|Systems|Business|Arts|Technology))/i,
			)
			if (fieldMatch && fieldMatch[1]) {
				field = fieldMatch[1].replace(/^(?:Science\s+in\s+)/i, '').trim()
			}
		}

		// Graduation date
		const gradMatch = line.match(
			/(?:Graduation|Expected|Graduated|Graduating)?\s*:?\s*([A-Za-z]+\s+\d{4}|\b(?:20\d{2})\b)/i,
		)
		if (gradMatch && !graduationDate) {
			graduationDate = gradMatch[1]?.trim()
		}

		// GPA
		const gpaMatch = line.match(/GPA:?\s*([0-4]\.\d{1,2}(?:\s*\/\s*4\.0)?)/i)
		if (gpaMatch && !gpa) {
			gpa = gpaMatch[1]?.trim()
		}
	}

	if (school || degree) {
		entries.push({
			id: crypto.randomUUID(),
			school: school || 'University',
			degree: degree || 'Bachelor of Science',
			field,
			graduationDate,
			gpa,
		})
	}

	return entries
}

// ─── Projects Extraction ───

function extractProjects(sections: Sections): Project[] {
	const projLines = sections.projects
	if (projLines.length === 0) return []

	const projects: Project[] = []
	let currentProj: Partial<Project> | null = null
	let currentBullets: string[] = []

	function commitProj() {
		if (currentProj && currentProj.name) {
			const cleanBullets = currentBullets.map((b) => b.trim()).filter((b) => b.length > 0)
			let desc = currentProj.description?.trim() || ''

			// If no explicit description was provided, use the bullets as description
			if (!desc && cleanBullets.length > 0) {
				desc = cleanBullets.join('\n')
			}

			projects.push({
				id: crypto.randomUUID(),
				name: currentProj.name,
				description: desc || undefined,
				technologies: currentProj.technologies || [],
				bullets: cleanBullets.length ? cleanBullets : (desc ? [desc] : ['']),
			})
		}
		currentProj = null
		currentBullets = []
	}

	for (let i = 0; i < projLines.length; i++) {
		const rawLine = projLines[i] ?? ''
		const line = rawLine.trim()
		if (!line) continue

		// Check if this line is an actual new project title
		if (isProjectTitleLine(line, currentProj)) {
			commitProj()

			let name = line
			let description = ''
			const technologies: string[] = []

			// Check for delimiters like "Project Name | Tech1, Tech2"
			if (line.includes('|')) {
				const parts = line.split('|')
				name = parts[0]?.trim() || line
				const techStr = parts[1]?.trim() || ''
				technologies.push(...techStr.split(/[,/]/).map((s) => s.trim()).filter(Boolean))
			} else if (line.includes('—') || line.includes(' - ')) {
				const parts = line.split(/—|\s-\s/)
				name = parts[0]?.trim() || line
				description = parts[1]?.trim() || ''
			} else if (line.includes(':')) {
				const parts = line.split(':')
				name = parts[0]?.trim() || line
				description = parts.slice(1).join(':').trim()
			}

			// Extract technologies in parentheses or brackets like "(Vue, Firebase)"
			const techMatch = name.match(/\(([^)]+)\)|\[([^\]]+)\]/)
			if (techMatch) {
				const techStr = techMatch[1] || techMatch[2] || ''
				technologies.push(...techStr.split(/[,|/]/).map((s) => s.trim()).filter(Boolean))
				name = name.replace(/\([^)]+\)|\[[^\]]+\]/, '').trim()
			}

			// Also extract any recognized technologies from tech dictionary
			for (const tech of TECH_DICTIONARY) {
				if (
					tech.pattern.test(rawLine) &&
					!technologies.some((t) => t.toLowerCase() === tech.name.toLowerCase())
				) {
					technologies.push(tech.name)
				}
			}

			currentProj = {
				name: name.replace(/[:\-–—]+$/, '').trim(),
				description: description || undefined,
				technologies,
			}
			continue
		}

		// Otherwise, this line belongs to currentProj
		if (!currentProj) {
			currentProj = {
				name: 'Project',
				technologies: [],
			}
		}

		const isExplicitBullet = isBulletLeader(line)
		const cleaned = stripBulletLeader(line)
		if (!cleaned) continue

		if (isExplicitBullet) {
			// Explicit bullet point
			currentBullets.push(cleaned)
		} else if (currentBullets.length === 0 && !currentProj.description && !ACTION_VERBS.test(cleaned)) {
			// First non-bullet sentence right under project title is the overview description
			currentProj.description = cleaned
		} else if (currentBullets.length === 0) {
			// First bullet under project
			currentBullets.push(cleaned)
		} else {
			// Check if this should be a new bullet or continuation of the previous bullet
			const lastIdx = currentBullets.length - 1
			const lastBullet = currentBullets[lastIdx] ?? ''
			const endsWithPunct = /[.!?;:]$/.test(lastBullet.trim())
			const startsWithVerb = ACTION_VERBS.test(cleaned)
			const startsWithCap = /^[A-Z]/.test(cleaned)

			if ((endsWithPunct && startsWithCap) || startsWithVerb) {
				currentBullets.push(cleaned)
			} else {
				currentBullets[lastIdx] = `${lastBullet} ${cleaned}`.trim()
			}
		}
	}

	commitProj()
	return projects
}

// ─── Certifications Extraction ───

function extractCertifications(sections: Sections): string[] {
	const certs: string[] = []
	for (const line of sections.certifications) {
		const clean = line.replace(/^[•\-*–▪]\s*/, '').trim()
		if (clean && clean.length > 2) {
			certs.push(clean)
		}
	}
	return certs
}
