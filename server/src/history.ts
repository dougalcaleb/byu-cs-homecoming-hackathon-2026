import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { HistoryEntry } from '../../shared/types'

// Swipe history, persisted in SQLite (Node's built-in `node:sqlite`, so no native dependency).
// Unlike server/.cache, this is user data: it lives in server/data/ and must not be deleted casually.
const DATA_DIR = join(import.meta.dirname, '..', 'data')

let db: DatabaseSync | null = null

function open() {
	if (db) return db
	mkdirSync(DATA_DIR, { recursive: true })
	db = new DatabaseSync(join(DATA_DIR, 'history.db'))
	db.exec(`
		CREATE TABLE IF NOT EXISTS swipe_history (
			user TEXT NOT NULL,
			job_id TEXT NOT NULL,
			company TEXT NOT NULL,
			title TEXT NOT NULL,
			direction TEXT NOT NULL CHECK (direction IN ('like', 'pass')),
			swiped_at TEXT NOT NULL,
			PRIMARY KEY (user, job_id)
		);
		CREATE INDEX IF NOT EXISTS swipe_history_by_user ON swipe_history (user, swiped_at DESC);
	`)
	return db
}

// One row per user and job: swiping a job again replaces its row
export function recordSwipe(user: string, entry: HistoryEntry) {
	open()
		.prepare(
			`INSERT INTO swipe_history (user, job_id, company, title, direction, swiped_at)
			VALUES (?, ?, ?, ?, ?, ?)
			ON CONFLICT (user, job_id) DO UPDATE SET
				company = excluded.company,
				title = excluded.title,
				direction = excluded.direction,
				swiped_at = excluded.swiped_at`,
		)
		.run(user, entry.jobId, entry.company, entry.title, entry.direction, entry.swipedAt)
}

// Newest first
export function listHistory(user: string): HistoryEntry[] {
	const rows = open()
		.prepare(
			`SELECT job_id, company, title, direction, swiped_at
			FROM swipe_history WHERE user = ? ORDER BY swiped_at DESC`,
		)
		.all(user) as {
		job_id: string
		company: string
		title: string
		direction: 'like' | 'pass'
		swiped_at: string
	}[]
	return rows.map((row) => ({
		jobId: row.job_id,
		company: row.company,
		title: row.title,
		direction: row.direction,
		swipedAt: row.swiped_at,
	}))
}
