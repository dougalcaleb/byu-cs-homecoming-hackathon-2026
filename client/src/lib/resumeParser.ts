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

// ─── Experience Extraction ───

const DATE_REGEX =
	/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|\d{1,2}\/\d{4})\s*(?:-|–|—|to)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|\d{1,2}\/\d{4}|Present|Current)/i

function extractExperience(sections: Sections): Experience[] {
	const expLines = sections.experience
	if (expLines.length === 0) return []

	const entries: Experience[] = []
	let currentEntry: Partial<Experience> | null = null
	let currentBullets: string[] = []

	function commitEntry() {
		if (currentEntry && (currentEntry.title || currentEntry.company)) {
			entries.push({
				id: crypto.randomUUID(),
				title: currentEntry.title || 'Software Developer',
				company: currentEntry.company || 'Company',
				location: currentEntry.location,
				startDate: currentEntry.startDate,
				endDate: currentEntry.endDate,
				isCurrent: currentEntry.isCurrent ?? false,
				bullets: [...currentBullets],
			})
		}
		currentEntry = null
		currentBullets = []
	}

	for (let i = 0; i < expLines.length; i++) {
		const line = expLines[i] ?? ''
		const isBullet = /^[•\-*–▪\d+\.]\s+/.test(line)
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
			const candidateLine = lineWithoutDate.length > 2
				? lineWithoutDate
				: (i > 0 && expLines[i - 1] && !expLines[i - 1]?.match(DATE_REGEX) && !/^[•\-*–▪]/.test(expLines[i - 1] ?? '')
					? (expLines[i - 1]?.trim() ?? '')
					: '')

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
			if (!company && i > 0 && expLines[i - 1] && expLines[i - 1] !== candidateLine && !expLines[i - 1]?.match(DATE_REGEX) && !/^[•\-*–▪]/.test(expLines[i - 1] ?? '')) {
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

		if (isBullet && currentEntry) {
			const bulletText = line.replace(/^[•\-*–▪\d+\.]\s*/, '').trim()
			if (bulletText) {
				currentBullets.push(bulletText)
			}
		} else if (currentEntry && currentBullets.length > 0) {
			// Append wrapped line to last bullet
			const lastIdx = currentBullets.length - 1
			if (currentBullets[lastIdx]) {
				currentBullets[lastIdx] += ' ' + line
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
		const degMatch = line.match(/(Bachelor\s+(?:of\s+[A-Za-z]+)?|Master\s+(?:of\s+[A-Za-z]+)?|BS|BA|MS|MA|B\.S\.|B\.A\.|M\.S\.|Associate|Ph\.D\.|Doctor)/i)
		if (degMatch && !degree) {
			degree = degMatch[0].trim()
			// Extract field from same line if present, e.g. "Bachelor of Science in Computer Science"
			const fieldMatch = line.match(/(?:in|of)\s+([A-Za-z\s]+(?:Science|Engineering|Systems|Business|Arts|Technology))/i)
			if (fieldMatch && fieldMatch[1]) {
				field = fieldMatch[1].replace(/^(?:Science\s+in\s+)/i, '').trim()
			}
		}

		// Graduation date
		const gradMatch = line.match(/(?:Graduation|Expected|Graduated|Graduating)?\s*:?\s*([A-Za-z]+\s+\d{4}|\b(?:20\d{2})\b)/i)
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
			projects.push({
				id: crypto.randomUUID(),
				name: currentProj.name,
				description: currentProj.description,
				technologies: currentProj.technologies || [],
				bullets: [...currentBullets],
			})
		}
		currentProj = null
		currentBullets = []
	}

	for (const line of projLines) {
		const isBullet = /^[•\-*–▪]\s+/.test(line)

		if (!isBullet && line.length < 80) {
			// Project title candidate, e.g. "Gig Glide — Vue, Vite, Tailwind" or "Trailhead: Hiking Trip Planner"
			commitProj()

			let name = line
			let description = ''
			const technologies: string[] = []

			if (line.includes(':')) {
				const parts = line.split(':')
				name = parts[0]?.trim() || line
				description = parts[1]?.trim() || ''
			} else if (line.includes('—') || line.includes(' - ')) {
				const parts = line.split(/—|\s-\s/)
				name = parts[0]?.trim() || line
				description = parts[1]?.trim() || ''
			}

			// Extract technologies if formatted like (Vue, Firebase) or [Vue, TypeScript]
			const techMatch = line.match(/\(([^)]+)\)|\[([^\]]+)\]/)
			if (techMatch) {
				const techStr = techMatch[1] || techMatch[2] || ''
				technologies.push(...techStr.split(/[,|/]/).map((s) => s.trim()).filter(Boolean))
				name = name.replace(/\([^)]+\)|\[[^\]]+\]/, '').trim()
			}

			currentProj = {
				name,
				description: description || undefined,
				technologies,
			}
		} else if (isBullet && currentProj) {
			const bullet = line.replace(/^[•\-*–▪]\s*/, '').trim()
			if (bullet) {
				currentBullets.push(bullet)
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
