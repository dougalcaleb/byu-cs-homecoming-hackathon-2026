import { watch, type WatchSource } from 'vue'

export function loadStored<T>(key: string): T | null {
	try {
		const raw = localStorage.getItem(key)
		return raw ? (JSON.parse(raw) as T) : null
	} catch {
		return null
	}
}

// Writes the source to localStorage whenever it changes; null/undefined removes the key
export function persist<T>(key: string, source: WatchSource<T>) {
	watch(
		source,
		(value) => {
			try {
				if (value == null) localStorage.removeItem(key)
				else localStorage.setItem(key, JSON.stringify(value))
			} catch {
				// Storage unavailable or full; the app still works for this session
			}
		},
		{ deep: true },
	)
}
