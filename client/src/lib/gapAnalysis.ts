import type { Gap, JobPosting, MatchAnalysis, Recommendation } from '@/types'

// Qualification lines with these words list nice-to-haves rather than requirements
const OPTIONAL_PATTERN =
	/\b(prefer|preferred|preferably|bonus|plus|nice to have|ideally|desired)\b/i

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Whole-word, case-insensitive; `\b` fails next to symbols ("C++", "C#"), so check neighbors instead
function mentions(line: string, skill: string): boolean {
	return new RegExp(`(^|[^\\w])${escapeRegExp(skill)}($|[^\\w])`, 'i').test(line)
}

function gapFor(job: JobPosting, skill: string, index: number): Gap {
	const line = job.highlights.qualifications.find((qualification) =>
		mentions(qualification, skill),
	)
	const required = line !== undefined && !OPTIONAL_PATTERN.test(line)
	return {
		id: `gap-${index}`,
		skill,
		requirement: line
			? `The posting asks for ${skill}.`
			: `${skill} comes up in this posting but not on your resume.`,
		// Qualification lines come from the description's bullets, so they anchor to it
		jobQuote: line,
		severity: required ? 'major' : 'minor',
	}
}

// Stand-in for a real match analysis: the ranking API's missing skills become the gaps
export function analysisFromRecommendation(
	recommendation: Recommendation,
	resumeId: string,
): MatchAnalysis {
	const { job } = recommendation
	return {
		jobId: job.id,
		resumeId,
		score: recommendation.score,
		summary: recommendation.reasons.join(' · '),
		highlights: [],
		gaps: recommendation.missingSkills.map((tag, index) => gapFor(job, tag.name, index)),
		tips: [],
		generatedAt: new Date().toISOString(),
	}
}
