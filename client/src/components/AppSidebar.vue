<script setup lang="ts">
import AppLogo from '@/components/AppLogo.vue'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const logosEnabled = !!import.meta.env.VITE_LOGO_DEV_TOKEN

const links = [
	{ to: '/', label: 'Match', isNew: true },
	{ to: '/history', label: 'History' },
	{ to: '/profile', label: 'Profile' },
	{ to: '/about', label: 'About' },
]

// A proper web 1.0 hit counter (it only counts your own visits)
function countVisit() {
	try {
		const visits = Number(localStorage.getItem('gig-glide:retro-visits') ?? 1336) + 1
		localStorage.setItem('gig-glide:retro-visits', String(visits))
		return visits
	} catch {
		return 1337
	}
}
const visitor = String(countVisit()).padStart(6, '0')
</script>

<template>
	<!-- Backdrop (mobile drawer only) -->
	<div v-if="open" class="fixed inset-0 z-20 bg-black/70 lg:hidden" @click="emit('close')" />

	<aside
		class="retro-window fixed inset-y-0 left-0 z-30 flex w-64 -translate-x-full flex-col transition-transform lg:translate-x-0"
		:class="{ 'translate-x-0': open }">
		<div class="retro-titlebar flex items-center justify-between gap-2 px-1.5 py-1">
			<RouterLink to="/" class="min-w-0" @click="emit('close')">
				<AppLogo />
			</RouterLink>
			<div class="flex shrink-0 gap-0.5">
				<span class="retro-title-btn" aria-hidden="true">_</span>
				<span class="retro-title-btn" aria-hidden="true">□</span>
				<button class="retro-title-btn ml-0.5" aria-label="Close menu" @click="emit('close')">✕</button>
			</div>
		</div>

		<!-- Menu bar -->
		<div class="flex gap-3 border-b border-[#808080] px-2 py-0.5 text-xs">
			<span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span><u>H</u>elp</span>
		</div>

		<div class="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
			<nav class="flex flex-col gap-1.5">
				<RouterLink v-for="link in links" :key="link.to" :to="link.to"
					class="retro-btn flex items-center justify-between px-3 py-1.5 text-sm"
					active-class="retro-pressed" @click="emit('close')">
					{{ link.label }}
					<span v-if="link.isNew" class="retro-blink bg-red-600 px-1 text-[10px] text-yellow-300">NEW!</span>
				</RouterLink>
			</nav>

			<div class="retro-construction retro-sunken p-1">
				<p class="bg-black px-2 py-1 text-center text-[11px] font-bold text-yellow-300">
					🚧 UNDER CONSTRUCTION 🚧
				</p>
			</div>

			<div class="text-center text-xs">
				<p>You are visitor number</p>
				<p class="retro-counter retro-sunken mx-auto mt-1 w-fit px-2 py-0.5 text-base">{{ visitor }}</p>
			</div>

			<div class="flex flex-wrap justify-center gap-1.5">
				<span class="retro-badge bg-[#003399] text-white">NETSCAPE<br />NOW!</span>
				<span class="retro-badge bg-[#ffcc00] text-black">MADE WITH<br />NOTEPAD</span>
				<span class="retro-badge bg-[#339933] text-white">VUE 3<br />POWERED</span>
				<span class="retro-badge bg-black text-[#33ff33]">Y2K<br />COMPLIANT</span>
			</div>

			<p class="text-center text-[10px] leading-tight text-[#404040]">
				Best viewed with Netscape Navigator 4.0 at 800×600
			</p>

			<!-- logo.dev's free tier requires a visible attribution link wherever its logos are shown -->
			<a v-if="logosEnabled" href="https://logo.dev" target="_blank" rel="noopener"
				class="mt-auto text-center text-xs text-[#0000ee] underline visited:text-[#551a8b]">
				Logos provided by Logo.dev
			</a>
		</div>
	</aside>
</template>
