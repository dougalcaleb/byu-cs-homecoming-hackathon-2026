import type { Tech } from '@/components/TechStackList.vue'
import type { JobPosting } from '@/types'

// Known technologies: [display name, Simple Icons slug, regex matched against job text]
const KNOWN: [string, string, RegExp][] = [
	['Vue', 'vuedotjs', /\bvue(\.js)?\b/i],
	['React', 'react', /\breact\b/i],
	['TypeScript', 'typescript', /\btypescript\b/i],
	['JavaScript', 'javascript', /\bjavascript\b/i],
	['Node.js', 'nodedotjs', /\bnode(\.js)?\b/i],
	['Python', 'python', /\bpython\b/i],
	['SQL', 'postgresql', /\b(sql|postgres(ql)?)\b/i],
	['Docker', 'docker', /\bdocker\b/i],
	['Git', 'git', /\bgit\b/i],
	['Tableau', 'tableau', /\btableau\b/i],
	['Vitest', 'vitest', /\bvitest\b/i],
	['Swift', 'swift', /\bswift\b/i],
	['Kotlin', 'kotlin', /\bkotlin\b/i],
	['Java', 'openjdk', /\bjava\b/i],
	['Go', 'go', /\bgolang\b/i],
	['AWS', 'amazonwebservices', /\baws\b/i],
	['PyTorch', 'pytorch', /\bpytorch\b/i],
]

export function extractTechStack(job: JobPosting): Tech[] {
	const text = [job.title, job.description, ...job.highlights.qualifications].join(' ')
	return KNOWN.filter(([, , pattern]) => pattern.test(text)).map(([name, icon]) => ({ name, icon }))
}
