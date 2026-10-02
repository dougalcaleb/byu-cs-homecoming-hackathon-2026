import type { Gap, GapCategory, LearningResource, ResourceKind } from '@/types'

const MAX_RESOURCES = 4

// Hand-picked links for common skills, keyed by lowercase skill name
const CURATED: Record<string, LearningResource[]> = {
	vue: [docs('Vue', 'Interactive Vue tutorial', 'https://vuejs.org/tutorial/')],
	react: [docs('React', 'Learn React', 'https://react.dev/learn')],
	typescript: [
		docs(
			'TypeScript',
			'The TypeScript Handbook',
			'https://www.typescriptlang.org/docs/handbook/intro.html',
		),
	],
	javascript: [
		docs('javascript.info', 'The Modern JavaScript Tutorial', 'https://javascript.info/'),
	],
	'node.js': [docs('Node.js', 'Learn Node.js', 'https://nodejs.org/en/learn')],
	python: [docs('Python', 'The Python Tutorial', 'https://docs.python.org/3/tutorial/')],
	sql: [
		practice('SQLBolt', 'Interactive SQL lessons', 'https://sqlbolt.com/'),
		practice('LeetCode', 'SQL 50 study plan', 'https://leetcode.com/studyplan/top-sql-50/'),
	],
	docker: [docs('Docker', 'Get started with Docker', 'https://docs.docker.com/get-started/')],
	git: [
		practice(
			'Learn Git Branching',
			'Interactive Git exercises',
			'https://learngitbranching.js.org/',
		),
		docs('Git', 'Pro Git book', 'https://git-scm.com/book/en/v2'),
	],
	tableau: [
		{
			provider: 'Tableau',
			title: 'Free Tableau training videos',
			url: 'https://www.tableau.com/learn/training',
			kind: 'video',
			isFree: true,
		},
	],
	'power bi': [
		{
			provider: 'Microsoft Learn',
			title: 'Power BI learning paths',
			url: 'https://learn.microsoft.com/en-us/training/powerplatform/power-bi',
			kind: 'course',
			isFree: true,
		},
	],
	vitest: [docs('Vitest', 'Getting started with Vitest', 'https://vitest.dev/guide/')],
	playwright: [docs('Playwright', 'Getting started', 'https://playwright.dev/docs/intro')],
	swift: [docs('Swift', 'Getting started with Swift', 'https://www.swift.org/getting-started/')],
	kotlin: [
		docs(
			'Kotlin',
			'Get started with Kotlin',
			'https://kotlinlang.org/docs/getting-started.html',
		),
	],
	java: [docs('dev.java', 'Learn Java', 'https://dev.java/learn/')],
	go: [practice('Go', 'A Tour of Go', 'https://go.dev/tour/')],
	aws: [
		{
			provider: 'AWS Skill Builder',
			title: 'AWS training',
			url: 'https://skillbuilder.aws/',
			kind: 'course',
			isFree: true,
		},
	],
	pytorch: [docs('PyTorch', 'PyTorch tutorials', 'https://pytorch.org/tutorials/')],
	'react native': [
		docs('React Native', 'Getting started', 'https://reactnative.dev/docs/getting-started'),
	],
	'machine learning': [
		{
			provider: 'Google',
			title: 'Machine Learning Crash Course',
			url: 'https://developers.google.com/machine-learning/crash-course',
			kind: 'course',
			isFree: true,
		},
	],
	'data structures and algorithms': [
		practice(
			'LeetCode',
			'Top Interview 150 study plan',
			'https://leetcode.com/studyplan/top-interview-150/',
		),
		practice('NeetCode', 'Algorithms roadmap', 'https://neetcode.io/roadmap'),
	],
}

// Other names the analysis might use for a curated skill
const ALIASES: Record<string, string> = {
	'vue.js': 'vue',
	'vue 3': 'vue',
	'react.js': 'react',
	node: 'node.js',
	nodejs: 'node.js',
	postgres: 'sql',
	postgresql: 'sql',
	golang: 'go',
	'amazon web services': 'aws',
	powerbi: 'power bi',
	algorithms: 'data structures and algorithms',
	'data structures': 'data structures and algorithms',
	dsa: 'data structures and algorithms',
}

interface Provider {
	name: string
	kind: ResourceKind
	isFree: boolean
	categories: GapCategory[]
	title: (skill: string) => string
	// Search URL on the provider's site; always resolves, whatever the skill is
	buildUrl: (query: string) => string
}

// Listed in the order they are offered
const PROVIDERS: Provider[] = [
	{
		name: 'LeetCode',
		kind: 'practice',
		isFree: true,
		categories: ['algorithms'],
		title: (skill) => `${skill} practice problems`,
		buildUrl: (query) => `https://leetcode.com/problemset/?search=${query}`,
	},
	{
		name: 'freeCodeCamp',
		kind: 'course',
		isFree: true,
		categories: ['language', 'framework', 'tool', 'concept', 'algorithms'],
		title: (skill) => `${skill} guides and tutorials`,
		buildUrl: (query) => `https://www.freecodecamp.org/news/search/?query=${query}`,
	},
	{
		name: 'LinkedIn Learning',
		kind: 'course',
		isFree: false,
		categories: ['language', 'framework', 'tool', 'concept', 'algorithms', 'soft-skill'],
		title: (skill) => `${skill} courses`,
		buildUrl: (query) => `https://www.linkedin.com/learning/search?keywords=${query}`,
	},
	{
		name: 'YouTube',
		kind: 'video',
		isFree: true,
		categories: ['language', 'framework', 'tool', 'concept', 'algorithms', 'soft-skill'],
		title: (skill) => `${skill} tutorials`,
		buildUrl: (query) => `https://www.youtube.com/results?search_query=${query}+tutorial`,
	},
	{
		name: 'Coursera',
		kind: 'course',
		isFree: false,
		categories: ['language', 'framework', 'tool', 'concept', 'algorithms', 'soft-skill'],
		title: (skill) => `${skill} courses`,
		buildUrl: (query) => `https://www.coursera.org/search?query=${query}`,
	},
]

function docs(provider: string, title: string, url: string): LearningResource {
	return { provider, title, url, kind: 'docs', isFree: true }
}

function practice(provider: string, title: string, url: string): LearningResource {
	return { provider, title, url, kind: 'practice', isFree: true }
}

// Links that teach a gap's skill: hand-picked ones first, then search links on learning sites.
// Returns [] for credentials, which no course can supply.
export function resourcesForGap(gap: Gap): LearningResource[] {
	const category = gap.category ?? 'concept'
	if (category === 'credential') return []

	// Analyses saved before `skill` existed only have the requirement sentence
	const skill = (gap.skill || gap.requirement).trim()
	if (!skill) return []

	const key = skill.toLowerCase()
	const curated = CURATED[ALIASES[key] ?? key] ?? []
	const query = encodeURIComponent(skill)
	const searches = PROVIDERS.filter((provider) => provider.categories.includes(category)).map(
		(provider): LearningResource => ({
			provider: provider.name,
			title: provider.title(skill),
			url: provider.buildUrl(query),
			kind: provider.kind,
			isFree: provider.isFree,
		}),
	)

	return [...curated, ...searches].slice(0, MAX_RESOURCES)
}
