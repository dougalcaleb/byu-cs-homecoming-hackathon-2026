import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const CACHE_DIR = join(import.meta.dirname, '..', '.cache')

interface Entry<T> {
	fetchedAt: number
	data: T
}

export interface FetchJsonOptions {
	ttlMs: number
	headers?: Record<string, string>
	// Cache key override, so secrets in the URL (api keys) never decide the file name
	key?: string
}

// Fetches JSON through an on-disk cache. Raw responses are cached (not normalized ones) so
// normalizer changes apply without refetching. If the network fails, stale data is returned,
// which keeps the demo working offline.
export async function fetchJsonCached<T>(url: string, options: FetchJsonOptions): Promise<T> {
	const file = join(CACHE_DIR, `${hash(options.key ?? url)}.json`)
	const cached = await readEntry<T>(file)
	if (cached && Date.now() - cached.fetchedAt < options.ttlMs) return cached.data

	try {
		const response = await fetch(url, { headers: options.headers })
		if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
		const data = (await response.json()) as T
		await mkdir(CACHE_DIR, { recursive: true })
		await writeFile(file, JSON.stringify({ fetchedAt: Date.now(), data } satisfies Entry<T>))
		return data
	} catch (error) {
		if (cached) return cached.data
		throw error
	}
}

async function readEntry<T>(file: string): Promise<Entry<T> | null> {
	try {
		return JSON.parse(await readFile(file, 'utf8')) as Entry<T>
	} catch {
		return null
	}
}

function hash(value: string) {
	return createHash('sha1').update(value).digest('hex')
}
