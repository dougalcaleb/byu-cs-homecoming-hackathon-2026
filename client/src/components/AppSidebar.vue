<script setup lang="ts">
import AppLogo from '@/components/AppLogo.vue'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const logosEnabled = !!import.meta.env.VITE_LOGO_DEV_TOKEN

const links = [
	{ to: '/', label: 'Match' },
	{ to: '/profile', label: 'Profile' },
	{ to: '/about', label: 'About' },
]
</script>

<template>
	<!-- Backdrop (mobile drawer only) -->
	<div v-if="open" class="fixed inset-0 z-20 bg-black/70 lg:hidden" @click="emit('close')" />

	<aside
		class="fixed inset-y-0 left-0 z-30 flex w-64 -translate-x-full flex-col gap-8 border-r border-border bg-page p-5 transition-transform lg:translate-x-0"
		:class="{ 'translate-x-0': open }">
		<RouterLink to="/" @click="emit('close')">
			<AppLogo />
		</RouterLink>

		<nav class="flex flex-col gap-1">
			<RouterLink v-for="link in links" :key="link.to" :to="link.to"
				class="rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-card hover:text-accent-soft"
				active-class="!bg-accent/10 !text-accent" @click="emit('close')">
				{{ link.label }}
			</RouterLink>
		</nav>

		<!-- logo.dev's free tier requires a visible attribution link wherever its logos are shown -->
		<a v-if="logosEnabled" href="https://logo.dev" target="_blank" rel="noopener"
			class="mt-auto px-3 text-xs text-muted transition-colors hover:text-accent-soft">
			Logos provided by Logo.dev
		</a>
	</aside>
</template>
