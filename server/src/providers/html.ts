import type { JobHighlights } from '../../../shared/types'

const NAMED_ENTITIES: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
	rsquo: '’',
	lsquo: '‘',
	rdquo: '”',
	ldquo: '“',
	ndash: '–',
	mdash: '—',
	hellip: '…',
	bull: '•',
}

export function decodeEntities(text: string) {
	return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
		if (entity[0] !== '#') return NAMED_ENTITIES[entity.toLowerCase()] ?? match
		const code =
			entity[1] === 'x' || entity[1] === 'X'
				? parseInt(entity.slice(2), 16)
				: parseInt(entity.slice(1), 10)
		return Number.isNaN(code) ? match : String.fromCodePoint(code)
	})
}

// Converts posting HTML to readable plain text, keeping paragraph and list structure
export function htmlToText(html: string) {
	const text = html
		.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<li\b[^>]*>/gi, '\n• ')
		.replace(/<\/(p|div|h[1-6]|li|ul|ol|tr|section)>/gi, '\n')
		.replace(/<[^>]+>/g, '')
	return decodeEntities(text)
		.split('\n')
		.map((line) => line.replace(/[ \t ]+/g, ' ').trim())
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim()
}

export function emptyHighlights(): JobHighlights {
	return { qualifications: [], responsibilities: [], benefits: [] }
}

// Maps a section heading ("What you'll do", "Nice to haves", "Perks") to a highlight group
export function classifyHeading(heading: string): keyof JobHighlights | null {
	const text = heading.toLowerCase().replace(/[’`]/g, "'")
	if (text.length > 80) return null
	if (/benefit|perks|we offer|compensation|why join|why work/.test(text)) return 'benefits'
	if (
		/qualif|requir|look(ing)? for|bring|need|must have|skills|about you|who you are|experience|nice to have|bonus|preferred|ideal candidate/.test(
			text,
		)
	) {
		return 'qualifications'
	}
	if (
		/responsib|you'll do|you will do|you'll|you will|day[- ]to[- ]day|the role|impact|duties|in this role/.test(
			text,
		)
	) {
		return 'responsibilities'
	}
	return null
}

const MAX_ITEMS_PER_GROUP = 15

// Pulls bullet lists out of posting HTML, grouped by the heading that precedes them.
// Postings without recognizable headings simply produce empty highlights.
export function extractHighlights(html: string): JobHighlights {
	const highlights = emptyHighlights()
	let group: keyof JobHighlights | null = null

	const tokens = /<(h[1-6]|strong|b)\b[^>]*>([\s\S]*?)<\/\1>|<li\b[^>]*>([\s\S]*?)<\/li>/gi
	for (const match of html.matchAll(tokens)) {
		const [, , heading, item] = match
		if (heading !== undefined) {
			group = classifyHeading(htmlToText(heading))
		} else if (item !== undefined && group) {
			const text = htmlToText(item).replace(/^•\s*/, '')
			if (text && highlights[group].length < MAX_ITEMS_PER_GROUP) highlights[group].push(text)
		}
	}
	return highlights
}
