import type { Board } from './providers/common'

// Public ATS job boards pulled into the job pool. To add a company, find its careers page on
// boards.greenhouse.io / jobs.lever.co / jobs.ashbyhq.com; the slug in that URL is the token.
// Every entry here returned jobs when checked on 2026-10-02.
export const BOARDS: Board[] = [
	// Utah
	{ provider: 'greenhouse', token: 'qualtrics', company: 'Qualtrics' },
	{ provider: 'greenhouse', token: 'lucidsoftware', company: 'Lucid' },
	{ provider: 'greenhouse', token: 'awardco', company: 'Awardco' },
	{ provider: 'greenhouse', token: 'jobnimbus', company: 'JobNimbus' },
	{ provider: 'greenhouse', token: 'route', company: 'Route' },
	{ provider: 'greenhouse', token: 'recursionpharmaceuticals', company: 'Recursion' },
	{ provider: 'lever', token: 'entrata', company: 'Entrata' },
	{ provider: 'lever', token: 'filevine', company: 'Filevine' },
	{ provider: 'lever', token: 'neighbor', company: 'Neighbor' },
	{ provider: 'lever', token: 'pattern', company: 'Pattern' },
	{ provider: 'ashby', token: 'weave', company: 'Weave' },
	{ provider: 'ashby', token: 'instructure', company: 'Instructure' },

	// Greenhouse
	{ provider: 'greenhouse', token: 'affirm', company: 'Affirm' },
	{ provider: 'greenhouse', token: 'airbnb', company: 'Airbnb' },
	{ provider: 'greenhouse', token: 'airtable', company: 'Airtable' },
	{ provider: 'greenhouse', token: 'anthropic', company: 'Anthropic' },
	{ provider: 'greenhouse', token: 'asana', company: 'Asana' },
	{ provider: 'greenhouse', token: 'brex', company: 'Brex' },
	{ provider: 'greenhouse', token: 'chime', company: 'Chime' },
	{ provider: 'greenhouse', token: 'cloudflare', company: 'Cloudflare' },
	{ provider: 'greenhouse', token: 'coinbase', company: 'Coinbase' },
	{ provider: 'greenhouse', token: 'databricks', company: 'Databricks' },
	{ provider: 'greenhouse', token: 'datadog', company: 'Datadog' },
	{ provider: 'greenhouse', token: 'discord', company: 'Discord' },
	{ provider: 'greenhouse', token: 'dropbox', company: 'Dropbox' },
	{ provider: 'greenhouse', token: 'duolingo', company: 'Duolingo' },
	{ provider: 'greenhouse', token: 'elastic', company: 'Elastic' },
	{ provider: 'greenhouse', token: 'figma', company: 'Figma' },
	{ provider: 'greenhouse', token: 'gitlab', company: 'GitLab' },
	{ provider: 'greenhouse', token: 'gusto', company: 'Gusto' },
	{ provider: 'greenhouse', token: 'instacart', company: 'Instacart' },
	{ provider: 'greenhouse', token: 'lyft', company: 'Lyft' },
	{ provider: 'greenhouse', token: 'mongodb', company: 'MongoDB' },
	{ provider: 'greenhouse', token: 'pinterest', company: 'Pinterest' },
	{ provider: 'greenhouse', token: 'reddit', company: 'Reddit' },
	{ provider: 'greenhouse', token: 'robinhood', company: 'Robinhood' },
	{ provider: 'greenhouse', token: 'roblox', company: 'Roblox' },
	{ provider: 'greenhouse', token: 'samsara', company: 'Samsara' },
	{ provider: 'greenhouse', token: 'scaleai', company: 'Scale AI' },
	{ provider: 'greenhouse', token: 'stripe', company: 'Stripe' },
	{ provider: 'greenhouse', token: 'twitch', company: 'Twitch' },
	{ provider: 'greenhouse', token: 'vercel', company: 'Vercel' },

	// Lever
	{ provider: 'lever', token: 'palantir', company: 'Palantir' },
	{ provider: 'lever', token: 'spotify', company: 'Spotify' },

	// Ashby
	{ provider: 'ashby', token: 'benchling', company: 'Benchling' },
	{ provider: 'ashby', token: 'linear', company: 'Linear' },
	{ provider: 'ashby', token: 'notion', company: 'Notion' },
	{ provider: 'ashby', token: 'openai', company: 'OpenAI' },
	{ provider: 'ashby', token: 'plaid', company: 'Plaid' },
	{ provider: 'ashby', token: 'ramp', company: 'Ramp' },
	{ provider: 'ashby', token: 'supabase', company: 'Supabase' },
	{ provider: 'ashby', token: 'zapier', company: 'Zapier' },
]
