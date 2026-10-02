import type { MatchAnalysis } from '@/types'

// Quotes must be exact substrings of mockResume.rawText and the matching job description
export const mockMatches = [
	{
		jobId: 'job-1',
		resumeId: 'resume-1',
		score: 82,
		summary:
			'Strong match: your Vue and TypeScript internship work lines up directly with this role. Testing experience is the main gap.',
		highlights: [
			{
				id: 'hl-1',
				resumeQuote: 'Built a Vue 3 dashboard used by 40 support agents',
				jobQuote: 'build customer-facing features in Vue 3 and TypeScript',
				kind: 'experience',
				reason: 'You have shipped a real Vue 3 product, which is the core of this job.',
			},
			{
				id: 'hl-2',
				resumeQuote: 'TypeScript, Vue, Python, SQL, Git, REST APIs',
				jobQuote: 'Experience with REST APIs is a plus',
				kind: 'skill',
				reason: 'Your skills list covers the stack and the REST API bonus.',
			},
		],
		gaps: [
			{
				id: 'gap-1',
				skill: 'Unit testing',
				category: 'concept',
				requirement: 'Writing unit tests as part of everyday work',
				jobQuote: 'write unit tests',
				severity: 'major',
			},
			{
				id: 'gap-3',
				skill: 'Data structures and algorithms',
				category: 'algorithms',
				requirement: 'Passing a coding interview on data structures and algorithms',
				jobQuote: 'The interview includes a data structures and algorithms round',
				severity: 'major',
			},
			{
				id: 'gap-2',
				skill: 'Vitest',
				category: 'tool',
				requirement: 'Automated testing tools',
				jobQuote: 'Familiarity with automated testing tools such as Vitest is preferred',
				severity: 'minor',
			},
		],
		tips: [
			{
				id: 'tip-1',
				category: 'missing-skill',
				text: 'Mention any unit tests you wrote during your internship or in Trailhead.',
			},
			{
				id: 'tip-2',
				category: 'quantify',
				text: 'Add the result of the dashboard, not just who used it.',
				resumeQuote: 'Built a Vue 3 dashboard used by 40 support agents',
				suggestedRewrite:
					'Built a Vue 3 and TypeScript dashboard used daily by 40 support agents, cutting ticket lookup time',
			},
		],
		generatedAt: '2026-10-02T16:05:00.000Z',
	},
	{
		jobId: 'job-2',
		resumeId: 'resume-1',
		score: 58,
		summary:
			'Partial match: you have the SQL and Python basics, but the role requires a BI tool you have not listed.',
		highlights: [
			{
				id: 'hl-1',
				resumeQuote: 'Wrote Python scripts to clean customer data',
				jobQuote: 'clean datasets in Python',
				kind: 'experience',
				reason: 'This is the same task the posting describes.',
			},
			{
				id: 'hl-2',
				resumeQuote: 'TypeScript, Vue, Python, SQL, Git, REST APIs',
				jobQuote: 'write SQL queries',
				kind: 'skill',
				reason: 'SQL is listed in your skills.',
			},
		],
		gaps: [
			{
				id: 'gap-1',
				skill: 'Tableau',
				category: 'tool',
				requirement: 'A BI tool: Tableau or Power BI',
				jobQuote: 'Experience with Tableau or Power BI is required',
				severity: 'major',
			},
			{
				id: 'gap-2',
				skill: 'Power BI',
				category: 'tool',
				requirement: 'A BI tool: Tableau or Power BI',
				jobQuote: 'Experience with Tableau or Power BI is required',
				severity: 'major',
			},
			{
				id: 'gap-3',
				skill: 'Presenting data to stakeholders',
				category: 'soft-skill',
				requirement: 'Communicating findings to non-technical stakeholders',
				jobQuote: 'build dashboards for stakeholders',
				severity: 'minor',
			},
		],
		tips: [
			{
				id: 'tip-1',
				category: 'keyword',
				text: 'Describe your dashboard work in analytics terms, such as the metrics it reported.',
				resumeQuote: 'Built a Vue 3 dashboard used by 40 support agents',
			},
			{
				id: 'tip-2',
				category: 'wording',
				text: 'Move SQL and Python to the front of your skills list for data roles.',
			},
		],
		generatedAt: '2026-10-02T16:06:00.000Z',
	},
] satisfies MatchAnalysis[]
