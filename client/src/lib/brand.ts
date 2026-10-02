import { reactive } from 'vue'
import { coverGradient } from '@/lib/cover'

// Brand lookup for job cards, straight from the browser:
//   1. The posting's own logo (JobPosting.companyLogoUrl) is used when it has one and it loads.
//   2. Otherwise logo.dev's image CDN returns the company's logo, looked up by company name. The token is a
//      *publishable* key (pk_...), which logo.dev designed to be used in the browser.
//   3. The card's gradient color is sampled from whichever logo was used, with a canvas.
// Put the token in client/.env.local as VITE_LOGO_DEV_TOKEN (see .env.example).
// Without it, cards fall back to a monogram and a gradient derived from the company name.
const TOKEN = import.meta.env.VITE_LOGO_DEV_TOKEN

export interface BrandColor {
	/** Hue 0-360 */
	h: number
	/** Saturation 0-1 */
	s: number
}

type BrandState =
	| { status: 'loading' }
	| { status: 'failed' }
	| { status: 'ready'; logoUrl: string; color: BrandColor | null }

// Reactive so a card updates the moment its brand finishes loading
const brands = reactive<Record<string, BrandState>>({})
// Keeping the Image objects alive keeps the decoded bitmaps in memory, so they paint instantly later
const images = new Map<string, HTMLImageElement>()

// Sampled colors are remembered across visits so the canvas work is not repeated
const CACHE_KEY = 'gig-glide:brand-colors:v1'
const savedColors: Record<string, BrandColor | null> = (() => {
	try {
		return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}')
	} catch {
		return {}
	}
})()

function rememberColor(company: string, color: BrandColor | null) {
	savedColors[company] = color
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify(savedColors))
	} catch {
		// Storage unavailable or full; the color is just sampled again next visit
	}
}

function logoUrlFor(company: string) {
	// fallback=404: a missing logo is an error we can handle, instead of logo.dev's own generated monogram
	const params = new URLSearchParams({
		token: TOKEN!,
		size: '128',
		retina: 'true',
		format: 'png',
		fallback: '404',
	})
	return `https://img.logo.dev/name/${encodeURIComponent(company)}?${params}`
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
	r /= 255
	g /= 255
	b /= 255
	const max = Math.max(r, g, b)
	const min = Math.min(r, g, b)
	const l = (max + min) / 2
	if (max === min) return [0, 0, l]
	const d = max - min
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
	let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
	h *= 60
	return [h, s, l]
}

/** The most prominent saturated color in an image, or a neutral for black/white/grey logos. Null if unreadable. */
export function colorFromImage(image: HTMLImageElement): BrandColor | null {
	try {
		const size = 32
		const canvas = document.createElement('canvas')
		canvas.width = canvas.height = size
		const context = canvas.getContext('2d', { willReadFrequently: true })!
		context.drawImage(image, 0, 0, size, size)
		const { data } = context.getImageData(0, 0, size, size)

		// Vote by hue (12 buckets), weighting each pixel by how colorful and opaque it is
		const buckets = Array.from({ length: 12 }, () => ({ weight: 0, hue: 0, saturation: 0 }))
		for (let i = 0; i < data.length; i += 4) {
			const alpha = data[i + 3]! / 255
			const [h, s, l] = rgbToHsl(data[i]!, data[i + 1]!, data[i + 2]!)
			if (alpha < 0.5 || s < 0.25 || l < 0.12 || l > 0.9) continue
			const bucket = buckets[Math.floor(h / 30) % 12]!
			const weight = s * alpha
			bucket.weight += weight
			bucket.hue += h * weight
			bucket.saturation += s * weight
		}
		const best = buckets.reduce((a, b) => (b.weight > a.weight ? b : a))
		if (best.weight === 0) return { h: 220, s: 0.08 } // no color in the logo: a neutral slate
		return { h: Math.round(best.hue / best.weight), s: best.saturation / best.weight }
	} catch {
		return null // canvas was tainted (no CORS) or unavailable
	}
}

/** Load and decode a logo. Tries CORS-enabled first (so its color can be read), then plain (display only). */
async function loadLogo(url: string, knownColor: BrandColor | null | undefined) {
	for (const crossOrigin of [true, false]) {
		const image = new Image()
		if (crossOrigin) image.crossOrigin = 'anonymous'
		image.src = url
		try {
			await image.decode()
		} catch {
			continue
		}
		images.set(url, image)
		return { color: knownColor !== undefined ? knownColor : crossOrigin ? colorFromImage(image) : null }
	}
	throw new Error('Logo failed to load')
}

/**
 * Download and decode a job's company logo, and sample its color, ahead of time. Safe to call repeatedly.
 * Tries the posting's own logo first, then logo.dev (if a token is configured).
 */
export function prefetchBrand(job: { company: string; companyLogoUrl?: string }) {
	const { company } = job
	if (brands[company]) return

	const candidates = [job.companyLogoUrl, TOKEN ? logoUrlFor(company) : undefined].filter(
		(url): url is string => !!url,
	)
	if (!candidates.length) return
	brands[company] = { status: 'loading' }

	void (async () => {
		for (const logoUrl of candidates) {
			try {
				const { color } = await loadLogo(logoUrl, savedColors[company])
				rememberColor(company, color)
				brands[company] = { status: 'ready', logoUrl, color }
				return
			} catch {
				// Try the next source
			}
		}
		brands[company] = { status: 'failed' }
	})()
}

/** Loaded logo URL for a company, or null if there is not one (yet) */
export function logoFor(company: string) {
	const state = brands[company]
	return state?.status === 'ready' ? state.logoUrl : null
}

/** Gradient built from the logo's color, or from the company name when there is no logo */
export function coverBackground(company: string) {
	const state = brands[company]
	if (state?.status === 'ready' && state.color) {
		const { h, s } = state.color
		const saturation = s < 0.15 ? Math.round(s * 100) : Math.min(75, Math.max(45, Math.round(s * 100)))
		return `linear-gradient(160deg, hsl(${h} ${saturation}% 36%), hsl(${(h + 25) % 360} ${saturation}% 14%))`
	}
	return coverGradient(company)
}
