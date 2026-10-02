<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'

const route = useRoute()
const menuOpen = ref(false)
watch(() => route.fullPath, () => (menuOpen.value = false))
</script>

<template>
	<AppSidebar :open="menuOpen" @close="menuOpen = false" />

	<!-- Content is offset by the sidebar on lg+, then centered as a mobile-width column -->
	<div class="lg:pl-64">
		<div class="mx-auto flex min-h-dvh w-full max-w-md flex-col border-x border-border bg-surface">
			<AppHeader @menu="menuOpen = true" />
			<main class="flex min-h-0 flex-1 flex-col">
				<RouterView />
			</main>
		</div>
	</div>
</template>
