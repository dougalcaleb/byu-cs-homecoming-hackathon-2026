// Deterministic cover art for a job card, derived from the company name so each company always looks the same.

function hash(text: string) {
	let value = 0
	for (const char of text) value = (value * 31 + char.charCodeAt(0)) >>> 0
	return value
}

/** Two-tone gradient, dark enough that white text stays readable on top of it */
export function coverGradient(company: string) {
	const seed = hash(company.toLowerCase())
	const hue = seed % 360
	const shift = 35 + ((seed >>> 8) % 50)
	return `linear-gradient(160deg, hsl(${hue} 55% 34%), hsl(${(hue + shift) % 360} 60% 14%))`
}

/** Up to two initials, used when there is no logo */
export function monogram(company: string) {
	const words = company.split(/\s+/).filter(Boolean)
	return words
		.slice(0, 2)
		.map((word) => word[0]!.toUpperCase())
		.join('')
}
