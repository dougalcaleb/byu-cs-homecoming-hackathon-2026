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
	<!-- Full-screen routes (splash, login, onboarding) render without shell -->
	<template v-if="route.meta.fullScreen">
		<RouterView />
	</template>

	<!-- Normal routes get sidebar + header -->
	<template v-else>
		<AppSidebar :open="menuOpen" @close="menuOpen = false" />

		<!-- Content fills the width beside the sidebar; individual views decide their own width -->
		<div class="lg:pl-64">
			<div class="flex min-h-dvh w-full flex-col">
				<AppHeader @menu="menuOpen = true" />
				<main class="flex min-h-0 flex-1 flex-col overflow-hidden">
					<RouterView />
				</main>
			</div>
		</div>
	</template>
</template>
