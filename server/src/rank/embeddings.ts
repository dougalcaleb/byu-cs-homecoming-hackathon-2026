import { env, pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { JobPosting } from '../../../shared/types'

// Sentence embeddings from a small local model (no API key, ~25MB download on first run).
// Vectors are L2-normalized, so the dot product is the cosine similarity.
const MODEL = 'Xenova/all-MiniLM-L6-v2'
export const DIMS = 384
const BATCH_SIZE = 32
const SAVE_EVERY_BATCHES = 20

const CACHE_DIR = join(import.meta.dirname, '..', '..', '.cache')
const INDEX_FILE = join(CACHE_DIR, 'job-embeddings.json')
const VECTORS_FILE = join(CACHE_DIR, 'job-embeddings.bin')
env.cacheDir = join(CACHE_DIR, 'models')

let extractor: Promise<FeatureExtractionPipeline> | null = null
// Serializes model calls so request-time embeddings wait for at most one background batch
let modelQueue: Promise<unknown> = Promise.resolve()

export function embed(texts: string[]): Promise<Float32Array[]> {
	const run = modelQueue.then(async () => {
		extractor ??= pipeline('feature-extraction', MODEL, { dtype: 'q8' })
		const model = await extractor
		const vectors: Float32Array[] = []
		for (let i = 0; i < texts.length; i += BATCH_SIZE) {
			const output = await model(texts.slice(i, i + BATCH_SIZE), {
				pooling: 'mean',
				normalize: true,
			})
			const data = output.data as Float32Array
			for (let row = 0; row < output.dims[0]!; row++) {
				vectors.push(data.slice(row * DIMS, (row + 1) * DIMS))
			}
		}
		return vectors
	})
	modelQueue = run.catch(() => undefined)
	return run
}

export function dot(a: Float32Array, b: Float32Array) {
	let sum = 0
	for (let i = 0; i < a.length; i++) sum += a[i]! * b[i]!
	return sum
}

// Mean of normalized vectors, renormalized; undefined for an empty list
export function centroid(vectors: Float32Array[]): Float32Array | undefined {
	if (vectors.length === 0) return undefined
	const sum = new Float32Array(DIMS)
	for (const vector of vectors) for (let i = 0; i < DIMS; i++) sum[i]! += vector[i]!
	const norm = Math.hypot(...sum) || 1
	return sum.map((value) => value / norm)
}

// ---------- Job vectors ----------

// The model reads ~256 tokens, so the most informative parts go first; company boilerplate
// usually opens the description.
export function jobText(job: JobPosting) {
	return [
		job.title,
		job.department,
		job.highlights.qualifications.slice(0, 6).join('. '),
		job.highlights.responsibilities.slice(0, 4).join('. '),
		job.description.slice(0, 1200),
	]
		.filter(Boolean)
		.join('\n')
}

// Keyed by job id plus a hash of the embedded text, so edited postings are re-embedded
const vectors = new Map<string, Float32Array>()
const keys = new WeakMap<JobPosting, string>()
let loaded: Promise<void> | null = null
let indexing: Promise<void> | null = null

function keyFor(job: JobPosting) {
	let key = keys.get(job)
	if (!key) {
		key = `${job.id}#${createHash('sha1').update(jobText(job)).digest('hex').slice(0, 12)}`
		keys.set(job, key)
	}
	return key
}

export function jobVector(job: JobPosting): Float32Array | undefined {
	return vectors.get(keyFor(job))
}

// Embeds any of these jobs that are not indexed yet
export async function ensureJobVectors(jobs: JobPosting[]) {
	await loadStore()
	const missing = jobs.filter((job) => !vectors.has(keyFor(job)))
	if (missing.length === 0) return
	const embedded = await embed(missing.map(jobText))
	missing.forEach((job, i) => vectors.set(keyFor(job), embedded[i]!))
}

// Embeds the whole pool in the background, saving progress to disk as it goes.
// ~9k jobs take a few minutes the first time; later runs only embed new postings.
export function indexInBackground(jobs: JobPosting[]) {
	indexing ??= (async () => {
		await loadStore()
		const missing = jobs.filter((job) => !vectors.has(keyFor(job)))
		if (missing.length === 0) return
		console.log(`[embeddings] indexing ${missing.length} jobs`)
		const started = Date.now()
		for (let i = 0, batch = 1; i < missing.length; i += BATCH_SIZE, batch++) {
			await ensureJobVectors(missing.slice(i, i + BATCH_SIZE))
			if (batch % SAVE_EVERY_BATCHES === 0) {
				await saveStore()
				console.log(
					`[embeddings] ${Math.min(i + BATCH_SIZE, missing.length)}/${missing.length}`,
				)
			}
		}
		await saveStore()
		console.log(`[embeddings] done in ${Math.round((Date.now() - started) / 1000)}s`)
	})()
		.catch((error) => console.warn('[embeddings] indexing failed:', (error as Error).message))
		.finally(() => (indexing = null))
	return indexing
}

export function indexStatus(jobs: JobPosting[]) {
	const indexed = jobs.filter((job) => vectors.has(keyFor(job))).length
	return { indexed, total: jobs.length, running: indexing !== null }
}

// ---------- Disk store ----------

function loadStore() {
	loaded ??= (async () => {
		try {
			const index = JSON.parse(await readFile(INDEX_FILE, 'utf8')) as {
				model: string
				keys: string[]
			}
			if (index.model !== MODEL) return
			const buffer = await readFile(VECTORS_FILE)
			const all = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4)
			index.keys.forEach((key, i) => vectors.set(key, all.slice(i * DIMS, (i + 1) * DIMS)))
			console.log(`[embeddings] loaded ${vectors.size} cached vectors`)
		} catch {
			// No cache yet
		}
	})()
	return loaded
}

async function saveStore() {
	const entries = [...vectors]
	const all = new Float32Array(entries.length * DIMS)
	entries.forEach(([, vector], i) => all.set(vector, i * DIMS))
	await mkdir(CACHE_DIR, { recursive: true })
	await writeFile(VECTORS_FILE, all)
	await writeFile(INDEX_FILE, JSON.stringify({ model: MODEL, keys: entries.map(([key]) => key) }))
}
