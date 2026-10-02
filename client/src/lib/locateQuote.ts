export interface TextRange {
	start: number
	end: number
}

// Finds a quote inside text, tolerating differences in whitespace and letter case.
// Returns null when the quote is not present, in which case the highlight should be skipped.
export function locateQuote(text: string, quote: string): TextRange | null {
	const words = quote.trim().split(/\s+/).filter(Boolean)
	if (words.length === 0) return null

	const pattern = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+')
	const match = new RegExp(pattern, 'i').exec(text)
	return match ? { start: match.index, end: match.index + match[0].length } : null
}
