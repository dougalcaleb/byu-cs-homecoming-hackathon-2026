import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const ACCOUNTS_KEY = 'gig-glide:accounts'
const SESSION_KEY = 'gig-glide:session'

interface Account {
	email: string
	password: string
	createdAt: string
}

interface Session {
	email: string
	loggedInAt: string
}

function loadJson<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(key)
		return raw ? (JSON.parse(raw) as T) : fallback
	} catch {
		return fallback
	}
}

export const useAuthStore = defineStore('auth', () => {
	const accounts = ref<Account[]>(loadJson(ACCOUNTS_KEY, []))
	const session = ref<Session | null>(loadJson(SESSION_KEY, null))

	const isAuthenticated = computed(() => session.value !== null)
	const currentEmail = computed(() => session.value?.email ?? null)

	function save() {
		localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts.value))
		if (session.value) {
			localStorage.setItem(SESSION_KEY, JSON.stringify(session.value))
		} else {
			localStorage.removeItem(SESSION_KEY)
		}
	}

	function signup(
		email: string,
		password: string,
	): { ok: boolean; error?: string } {
		if (accounts.value.some((a) => a.email === email)) {
			return { ok: false, error: 'An account with this email already exists' }
		}
		accounts.value.push({
			email,
			password,
			createdAt: new Date().toISOString(),
		})
		session.value = { email, loggedInAt: new Date().toISOString() }
		save()
		return { ok: true }
	}

	function login(
		email: string,
		password: string,
	): { ok: boolean; error?: string } {
		const account = accounts.value.find((a) => a.email === email)
		if (!account) {
			return { ok: false, error: 'No account found with this email' }
		}
		if (account.password !== password) {
			return { ok: false, error: 'Incorrect password' }
		}
		session.value = { email, loggedInAt: new Date().toISOString() }
		save()
		return { ok: true }
	}

	function logout() {
		session.value = null
		save()
	}

	return { isAuthenticated, currentEmail, signup, login, logout }
})
