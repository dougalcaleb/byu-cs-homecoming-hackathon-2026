import type { Resume } from '@/types'

const rawText = [
	'Jordan Rivera',
	'Provo, UT | jordan.rivera@example.com | github.com/jrivera',
	'',
	'SKILLS',
	'TypeScript, Vue, Python, SQL, Git, REST APIs',
	'',
	'EXPERIENCE',
	'Software Engineering Intern, Canyon Labs — May 2025 to Aug 2025',
	'- Built a Vue 3 dashboard used by 40 support agents',
	'- Wrote Python scripts to clean customer data',
	'Teaching Assistant, BYU Computer Science — Sep 2024 to Present',
	'- Helped students debug data structures assignments',
	'',
	'EDUCATION',
	'Brigham Young University, BS Computer Science — Apr 2027',
	'',
	'PROJECTS',
	'Trailhead: a hiking trip planner built with Vue and Firebase',
].join('\n')

export const mockResume = {
	id: 'resume-1',
	fileName: 'jordan-rivera-resume.pdf',
	uploadedAt: '2026-10-02T16:00:00.000Z',
	rawText,
	contact: {
		name: 'Jordan Rivera',
		email: 'jordan.rivera@example.com',
		location: 'Provo, UT',
		links: ['github.com/jrivera'],
	},
	skills: ['TypeScript', 'Vue', 'Python', 'SQL', 'Git', 'REST APIs'],
	experience: [
		{
			id: 'exp-1',
			title: 'Software Engineering Intern',
			company: 'Canyon Labs',
			startDate: 'May 2025',
			endDate: 'Aug 2025',
			isCurrent: false,
			bullets: [
				'Built a Vue 3 dashboard used by 40 support agents',
				'Wrote Python scripts to clean customer data',
			],
		},
		{
			id: 'exp-2',
			title: 'Teaching Assistant',
			company: 'BYU Computer Science',
			startDate: 'Sep 2024',
			endDate: 'Present',
			isCurrent: true,
			bullets: ['Helped students debug data structures assignments'],
		},
	],
	education: [
		{
			id: 'edu-1',
			school: 'Brigham Young University',
			degree: 'BS',
			field: 'Computer Science',
			graduationDate: 'Apr 2027',
		},
	],
	projects: [
		{
			id: 'proj-1',
			name: 'Trailhead',
			description: 'A hiking trip planner',
			technologies: ['Vue', 'Firebase'],
			bullets: [],
		},
	],
	certifications: [],
	searchProfile: {
		titles: ['Software Engineer Intern', 'Frontend Developer Intern'],
		keywords: ['TypeScript', 'Vue', 'Python', 'SQL'],
		location: 'Provo, UT',
		seniority: 'intern',
	},
} satisfies Resume
