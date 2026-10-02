<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useResumeStore } from '@/stores/resume'
import AppLogo from '@/components/AppLogo.vue'

const router = useRouter()
const auth = useAuthStore()
const resumeStore = useResumeStore()

const mode = ref<'login' | 'signup'>('login')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPw = ref(false)
const error = ref('')
const loading = ref(false)

const isSignup = computed(() => mode.value === 'signup')

function switchTab(tab: 'login' | 'signup') {
	mode.value = tab
	error.value = ''
}

async function submit() {
	error.value = ''

	if (!email.value.trim() || !password.value) {
		error.value = 'Please fill in all fields'
		return
	}

	if (isSignup.value && password.value !== confirmPassword.value) {
		error.value = 'Passwords do not match'
		return
	}

	if (isSignup.value && password.value.length < 6) {
		error.value = 'Password must be at least 6 characters'
		return
	}

	loading.value = true
	// Simulate network latency
	await new Promise((r) => setTimeout(r, 800))

	const result = isSignup.value
		? auth.signup(email.value.trim(), password.value)
		: auth.login(email.value.trim(), password.value)

	loading.value = false

	if (!result.ok) {
		error.value = result.error ?? 'Something went wrong'
		return
	}

	// Navigate based on whether user already has a resume
	router.push(resumeStore.current ? '/' : '/onboarding')
}
</script>

<template>
	<div id="login-screen" class="fixed inset-0 flex items-center justify-center bg-page">
		<!-- Background ambient blobs -->
		<div class="pointer-events-none absolute inset-0 overflow-hidden">
			<div
				class="absolute -top-40 -right-40 size-[500px] rounded-full bg-accent/5 blur-[150px]"
			/>
			<div
				class="absolute -bottom-40 -left-40 size-[400px] rounded-full bg-accent/3 blur-[120px]"
			/>
		</div>

		<!-- Auth card -->
		<div class="relative z-10 w-full max-w-sm px-6">
			<div
				class="rounded-2xl border border-border/60 bg-surface/70 p-8 shadow-2xl shadow-black/40 backdrop-blur-2xl"
			>
				<!-- Logo -->
				<div class="mb-8 flex justify-center">
					<AppLogo />
				</div>

				<!-- Tab toggle -->
				<div class="mb-6 flex rounded-xl bg-page/60 p-1">
					<button
						v-for="tab in (['login', 'signup'] as const)"
						:key="tab"
						:id="`auth-tab-${tab}`"
						class="flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200"
						:class="
							mode === tab
								? 'bg-card text-neutral-100 shadow-sm'
								: 'text-muted hover:text-neutral-300'
						"
						@click="switchTab(tab)"
					>
						{{ tab === 'login' ? 'Log In' : 'Sign Up' }}
					</button>
				</div>

				<!-- Error message -->
				<Transition name="slide-down">
					<div
						v-if="error"
						class="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400"
					>
						{{ error }}
					</div>
				</Transition>

				<!-- Form -->
				<form class="flex flex-col gap-4" @submit.prevent="submit">
					<!-- Email -->
					<div class="relative">
						<svg
							class="absolute left-3.5 top-3.5 size-4 text-muted"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<rect x="2" y="4" width="20" height="16" rx="2" />
							<path d="M22 7l-10 6L2 7" />
						</svg>
						<input
							id="auth-email"
							v-model="email"
							type="email"
							placeholder="Email address"
							autocomplete="email"
							class="w-full rounded-xl border border-border/60 bg-page/40 py-3 pl-10 pr-4 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/50"
						/>
					</div>

					<!-- Password -->
					<div class="relative">
						<svg
							class="absolute left-3.5 top-3.5 size-4 text-muted"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<rect x="3" y="11" width="18" height="11" rx="2" />
							<path d="M7 11V7a5 5 0 0110 0v4" />
						</svg>
						<input
							id="auth-password"
							v-model="password"
							:type="showPw ? 'text' : 'password'"
							placeholder="Password"
							autocomplete="current-password"
							class="w-full rounded-xl border border-border/60 bg-page/40 py-3 pl-10 pr-10 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/50"
						/>
						<button
							type="button"
							class="absolute right-3 top-3 rounded-md p-0.5 text-muted transition-colors hover:text-neutral-300"
							aria-label="Toggle password visibility"
							@click="showPw = !showPw"
						>
							<!-- Eye open -->
							<svg
								v-if="!showPw"
								class="size-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
								<circle cx="12" cy="12" r="3" />
							</svg>
							<!-- Eye closed -->
							<svg
								v-else
								class="size-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path
									d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
								/>
								<line x1="1" y1="1" x2="23" y2="23" />
							</svg>
						</button>
					</div>

					<!-- Confirm password (signup only) -->
					<Transition name="slide-down">
						<div v-if="isSignup" class="relative">
							<svg
								class="absolute left-3.5 top-3.5 size-4 text-muted"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<rect x="3" y="11" width="18" height="11" rx="2" />
								<path d="M7 11V7a5 5 0 0110 0v4" />
							</svg>
							<input
								id="auth-confirm-password"
								v-model="confirmPassword"
								:type="showPw ? 'text' : 'password'"
								placeholder="Confirm password"
								autocomplete="new-password"
								class="w-full rounded-xl border border-border/60 bg-page/40 py-3 pl-10 pr-4 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/50"
							/>
						</div>
					</Transition>

					<!-- Submit -->
					<button
						id="auth-submit"
						type="submit"
						:disabled="loading"
						class="mt-2 flex items-center justify-center rounded-xl bg-accent py-3 text-sm font-semibold text-page shadow-md shadow-accent/20 transition-all duration-200 hover:bg-accent-soft hover:shadow-accent-soft/25 disabled:opacity-50 disabled:shadow-none"
					>
						<svg
							v-if="loading"
							class="mr-2 size-4 animate-spin"
							viewBox="0 0 24 24"
							fill="none"
						>
							<circle
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="3"
								class="opacity-25"
							/>
							<path
								d="M4 12a8 8 0 018-8"
								stroke="currentColor"
								stroke-width="3"
								stroke-linecap="round"
							/>
						</svg>
						{{ isSignup ? 'Create Account' : 'Log In' }}
					</button>
				</form>

				<!-- Toggle link -->
				<p class="mt-6 text-center text-xs text-muted">
					{{ isSignup ? 'Already have an account?' : "Don't have an account?" }}
					<button
						class="ml-1 font-medium text-accent transition-colors hover:text-accent-soft"
						@click="switchTab(isSignup ? 'login' : 'signup')"
					>
						{{ isSignup ? 'Log in' : 'Sign up' }}
					</button>
				</p>
			</div>
		</div>
	</div>
</template>

<style scoped>
.slide-down-enter-active {
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-down-leave-active {
	transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
	opacity: 0;
	transform: translateY(-8px);
}
</style>
