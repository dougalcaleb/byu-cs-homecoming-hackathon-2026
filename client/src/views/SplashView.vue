<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const videoEnded = ref(false)
const leaving = ref(false)

function onVideoEnd() {
	videoEnded.value = true
}

function getStarted() {
	leaving.value = true
	setTimeout(() => router.push('/login'), 500)
}
</script>

<template>
	<div
		id="splash-screen"
		class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-page transition-all duration-500"
		:class="leaving && 'opacity-0 scale-105'"
	>
		<!-- Ambient glow behind the logo -->
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
			<div class="size-96 rounded-full bg-accent/8 blur-[120px]" />
		</div>

		<!-- Dynamic logo video -->
		<video
			class="relative z-10 w-72 drop-shadow-2xl sm:w-80"
			autoplay
			muted
			playsinline
			@ended="onVideoEnd"
		>
			<source src="/gigglidedynamicm3.webm" type="video/webm" />
		</video>

		<!-- Fallback: auto-show button after 5s if video doesn't fire ended -->
		<Transition name="fade-up">
			<button
				v-if="videoEnded"
				id="splash-get-started"
				class="relative z-10 mt-12 rounded-xl bg-accent px-10 py-3.5 text-sm font-semibold text-page shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent-soft hover:shadow-accent-soft/30 hover:scale-[1.03] active:scale-[0.97]"
				@click="getStarted"
			>
				Get Started
			</button>
		</Transition>
	</div>
</template>

<style scoped>
.fade-up-enter-active {
	transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-up-enter-from {
	opacity: 0;
	transform: translateY(20px);
}
</style>
