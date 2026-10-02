import type { JobPosting, SkillTag } from '../../../shared/types'

interface SkillDef {
	name: string
	// Simple Icons slug (https://simpleicons.org); omitted when there is no icon
	icon?: string
	// Lowercase phrases matched as whole tokens, in addition to the name
	aliases?: string[]
	// The name is a common word ("Go", "C" as in Series C), so only the aliases are matched
	ambiguous?: boolean
}

// Common-word names ("Go", "C", "R", "Excel" the verb, "Spring" the season, "Swift" the bank
// network) are marked ambiguous and only match through their longer aliases.
const SKILLS: SkillDef[] = [
	// Languages
	{ name: 'JavaScript', icon: 'javascript', aliases: ['js', 'es6', 'ecmascript'] },
	{ name: 'TypeScript', icon: 'typescript' },
	{ name: 'Python', icon: 'python' },
	{ name: 'Java', icon: 'openjdk' },
	{ name: 'C++', icon: 'cplusplus', aliases: ['cpp'] },
	{
		name: 'C',
		ambiguous: true,
		icon: 'c',
		aliases: ['c programming', 'c language', 'embedded c', 'ansi c'],
	},
	{ name: 'C#', icon: 'dotnet', aliases: ['csharp', 'c sharp'] },
	{ name: 'Go', ambiguous: true, icon: 'go', aliases: ['golang', 'go language'] },
	{ name: 'Rust', icon: 'rust' },
	{ name: 'Ruby', icon: 'ruby' },
	{ name: 'PHP', icon: 'php' },
	{ name: 'Kotlin', icon: 'kotlin' },
	{ name: 'Swift', ambiguous: true, icon: 'swift', aliases: ['swiftui', 'swift programming'] },
	{ name: 'Scala', icon: 'scala' },
	{
		name: 'R',
		ambiguous: true,
		icon: 'r',
		aliases: ['r programming', 'r language', 'rstudio', 'tidyverse'],
	},
	{ name: 'MATLAB', aliases: ['matlab'] },
	{ name: 'Dart', icon: 'dart' },
	{ name: 'Elixir', icon: 'elixir' },
	{ name: 'Haskell', icon: 'haskell' },
	{ name: 'Lua', icon: 'lua' },
	{ name: 'Perl', icon: 'perl' },
	{
		name: 'Bash',
		icon: 'gnubash',
		aliases: ['shell scripting', 'shell scripts', 'bash scripting'],
	},
	{ name: 'PowerShell', aliases: ['powershell'] },
	{ name: 'SQL', icon: 'postgresql', aliases: ['t-sql', 'pl/sql', 'tsql'] },
	{ name: 'HTML', icon: 'html5', aliases: ['html5'] },
	{ name: 'CSS', icon: 'css', aliases: ['css3'] },
	{ name: 'Solidity', icon: 'solidity' },

	// Frontend
	{ name: 'React', icon: 'react', aliases: ['react.js', 'reactjs'] },
	{ name: 'React Native', icon: 'react' },
	{ name: 'Vue', icon: 'vuedotjs', aliases: ['vue.js', 'vuejs', 'vue 3', 'vue3'] },
	{ name: 'Angular', icon: 'angular', aliases: ['angularjs', 'angular.js'] },
	{ name: 'Svelte', icon: 'svelte', aliases: ['sveltekit'] },
	{ name: 'Next.js', icon: 'nextdotjs', aliases: ['nextjs'] },
	{ name: 'Nuxt', icon: 'nuxt', aliases: ['nuxt.js', 'nuxtjs'] },
	{ name: 'Redux', icon: 'redux' },
	{ name: 'Tailwind CSS', icon: 'tailwindcss', aliases: ['tailwind'] },
	{ name: 'Sass', icon: 'sass', aliases: ['scss'] },
	{ name: 'jQuery', icon: 'jquery' },
	{ name: 'Webpack', icon: 'webpack' },
	{ name: 'Vite', icon: 'vite' },
	{ name: 'Flutter', icon: 'flutter' },
	{ name: 'iOS', icon: 'ios', aliases: ['ios development'] },
	{ name: 'Android', icon: 'android' },

	// Backend
	{ name: 'Node.js', icon: 'nodedotjs', aliases: ['node', 'nodejs'] },
	{ name: 'Express', icon: 'express', aliases: ['express.js', 'expressjs'] },
	{ name: 'NestJS', icon: 'nestjs', aliases: ['nest.js'] },
	{ name: 'Django', icon: 'django' },
	{ name: 'Flask', icon: 'flask' },
	{ name: 'FastAPI', icon: 'fastapi' },
	{
		name: 'Spring',
		ambiguous: true,
		icon: 'spring',
		aliases: ['spring boot', 'springboot', 'spring framework'],
	},
	{ name: 'Ruby on Rails', icon: 'rubyonrails', aliases: ['rails', 'ror'] },
	{ name: '.NET', icon: 'dotnet', aliases: ['.net core', 'asp.net', 'dotnet'] },
	{ name: 'Laravel', icon: 'laravel' },
	{ name: 'GraphQL', icon: 'graphql' },
	{ name: 'REST APIs', aliases: ['restful', 'rest api', 'rest apis', 'restful apis'] },
	{ name: 'gRPC' },
	{ name: 'Microservices', aliases: ['microservice', 'microservices architecture'] },

	// Data stores
	{ name: 'PostgreSQL', icon: 'postgresql', aliases: ['postgres'] },
	{ name: 'MySQL', icon: 'mysql' },
	{ name: 'SQLite', icon: 'sqlite' },
	{ name: 'MongoDB', icon: 'mongodb', aliases: ['mongo'] },
	{ name: 'Redis', icon: 'redis' },
	{ name: 'Elasticsearch', icon: 'elasticsearch', aliases: ['elastic search', 'opensearch'] },
	{ name: 'DynamoDB' },
	{ name: 'Cassandra', icon: 'apachecassandra' },
	{ name: 'Snowflake', icon: 'snowflake' },
	{ name: 'BigQuery', icon: 'googlebigquery' },
	{ name: 'Firebase', icon: 'firebase' },
	{ name: 'Supabase', icon: 'supabase' },

	// Cloud and infrastructure
	{
		name: 'AWS',
		aliases: ['amazon web services', 'ec2', 's3', 'lambda'],
	},
	{ name: 'GCP', icon: 'googlecloud', aliases: ['google cloud', 'google cloud platform'] },
	{ name: 'Azure', aliases: ['microsoft azure', 'azure devops'] },
	{ name: 'Docker', icon: 'docker', aliases: ['containers', 'containerization'] },
	{ name: 'Kubernetes', icon: 'kubernetes', aliases: ['k8s', 'helm'] },
	{ name: 'Terraform', icon: 'terraform', aliases: ['infrastructure as code', 'iac'] },
	{ name: 'Ansible', icon: 'ansible' },
	{ name: 'Linux', icon: 'linux', aliases: ['unix'] },
	{
		name: 'CI/CD',
		icon: 'githubactions',
		aliases: ['continuous integration', 'github actions', 'jenkins', 'gitlab ci', 'circleci'],
	},
	{ name: 'Git', icon: 'git', aliases: ['github', 'gitlab', 'version control'] },
	{ name: 'Nginx', icon: 'nginx' },
	{ name: 'Prometheus', icon: 'prometheus' },
	{ name: 'Grafana', icon: 'grafana' },
	{ name: 'Datadog', icon: 'datadog' },

	// Data and ML
	{ name: 'Machine Learning', aliases: ['ml', 'machine-learning'] },
	{ name: 'Deep Learning', aliases: ['neural networks', 'neural network'] },
	{
		name: 'LLMs',
		aliases: ['llm', 'large language models', 'large language model', 'generative ai', 'genai'],
	},
	{ name: 'NLP', aliases: ['natural language processing'] },
	{ name: 'Computer Vision', aliases: ['opencv'] },
	{ name: 'PyTorch', icon: 'pytorch' },
	{ name: 'TensorFlow', icon: 'tensorflow', aliases: ['keras'] },
	{ name: 'scikit-learn', icon: 'scikitlearn', aliases: ['sklearn', 'scikit learn'] },
	{ name: 'Pandas', icon: 'pandas' },
	{ name: 'NumPy', icon: 'numpy' },
	{ name: 'Jupyter', icon: 'jupyter', aliases: ['jupyter notebooks'] },
	{ name: 'Spark', icon: 'apachespark', aliases: ['apache spark', 'pyspark'] },
	{ name: 'Kafka', icon: 'apachekafka', aliases: ['apache kafka'] },
	{ name: 'Airflow', icon: 'apacheairflow', aliases: ['apache airflow'] },
	{ name: 'dbt' },
	{ name: 'Databricks', icon: 'databricks' },
	{ name: 'Hadoop', icon: 'apachehadoop' },
	{ name: 'ETL', aliases: ['data pipelines', 'data pipeline', 'elt'] },
	{
		name: 'Statistics',
		aliases: ['statistical analysis', 'statistical modeling', 'a/b testing'],
	},
	{ name: 'Tableau' },
	{ name: 'Power BI', aliases: ['powerbi'] },
	{ name: 'Looker', icon: 'looker' },
	{
		name: 'Excel',
		ambiguous: true,
		aliases: ['microsoft excel', 'ms excel', 'advanced excel', 'excel spreadsheets'],
	},
	{ name: 'Data Visualization', aliases: ['dashboards', 'dashboarding'] },

	// Testing and quality
	{
		name: 'Unit Testing',
		aliases: ['unit tests', 'unit test', 'tdd', 'test-driven development'],
	},
	{ name: 'Jest', icon: 'jest' },
	{ name: 'Vitest', icon: 'vitest' },
	{ name: 'Cypress', icon: 'cypress' },
	{ name: 'Playwright', aliases: ['playwright'] },
	{ name: 'Selenium', icon: 'selenium' },
	{ name: 'pytest', icon: 'pytest' },

	// Security and systems
	{ name: 'Security', aliases: ['cybersecurity', 'application security', 'appsec', 'infosec'] },
	{ name: 'Networking', aliases: ['tcp/ip', 'dns', 'networking protocols'] },
	{ name: 'Distributed Systems', aliases: ['distributed computing'] },
	{ name: 'Embedded Systems', aliases: ['embedded software', 'firmware', 'rtos'] },

	// Design and product
	{ name: 'Figma', icon: 'figma' },
	{ name: 'UX Design', aliases: ['ux', 'user experience', 'ui/ux', 'ux/ui', 'user research'] },
	{ name: 'Product Management', aliases: ['product roadmap', 'roadmapping'] },

	// Practices and tools
	{ name: 'Agile', aliases: ['scrum', 'kanban'] },
	{ name: 'Jira', icon: 'jira' },
	{ name: 'Salesforce', aliases: ['salesforce'] },
	{ name: 'Unity', icon: 'unity' },
	{ name: 'Unreal Engine', icon: 'unrealengine', aliases: ['unreal'] },
]

const MAX_PHRASE_WORDS = 3

// Tokens keep in-word punctuation so "node.js", "c++", "c#", ".net" and "ci/cd" survive
function tokenize(text: string) {
	return text.toLowerCase().match(/\.?[a-z0-9+#]+(?:[./\-][a-z0-9+#]+)*\+*/g) ?? []
}

// Same, but "react/vue" and "front-end" become separate words
function tokenizeSplit(text: string) {
	return tokenize(text).flatMap((token) => token.split(/[/\-]/).filter(Boolean))
}

const byPhrase = new Map<string, SkillDef>()
const byName = new Map<string, SkillDef>()
for (const skill of SKILLS) {
	byName.set(skill.name.toLowerCase(), skill)
	for (const phrase of [...(skill.ambiguous ? [] : [skill.name]), ...(skill.aliases ?? [])]) {
		byPhrase.set(tokenize(phrase).join(' '), skill)
	}
}

// Canonical skill names mentioned in the text, in order of first mention. Runs in one pass over
// the tokens, so it is cheap enough for every job in the pool.
export function extractSkills(text: string): string[] {
	const found = new Set<string>()
	matchPhrases(tokenize(text), found)
	matchPhrases(tokenizeSplit(text), found)
	return [...found]
}

function matchPhrases(tokens: string[], found: Set<string>) {
	for (let i = 0; i < tokens.length; i++) {
		let phrase = ''
		for (let n = 0; n < MAX_PHRASE_WORDS && i + n < tokens.length; n++) {
			phrase = n === 0 ? tokens[i]! : `${phrase} ${tokens[i + n]}`
			const skill = byPhrase.get(phrase)
			if (skill) found.add(skill.name)
		}
	}
}

// Skills a posting asks for. A company naming its own product ("Datadog" at Datadog) is not a
// requirement, so skills that match the company name are dropped.
export function jobSkills(job: JobPosting): string[] {
	let skills = jobSkillCache.get(job)
	if (!skills) {
		const text = [job.title, ...job.highlights.qualifications, job.description].join('\n')
		const company = job.company.toLowerCase()
		skills = extractSkills(text).filter((skill) => !company.includes(skill.toLowerCase()))
		jobSkillCache.set(job, skills)
	}
	return skills
}

const jobSkillCache = new WeakMap<JobPosting, string[]>()

// Maps free-form skills ("Vue 3", "node") to canonical names; unknown ones are dropped
export function normalizeSkills(skills: string[]): string[] {
	return [...new Set(skills.flatMap((skill) => extractSkills(skill)))]
}

export function toSkillTags(names: string[]): SkillTag[] {
	return names.map((name) => ({ name, icon: byName.get(name.toLowerCase())?.icon }))
}

export const ALL_SKILLS = SKILLS
