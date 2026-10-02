<script setup lang="ts">
import { onMounted, ref } from 'vue'
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

onMounted(() => {
	// Fallback: show button after 4s if video end event is delayed
	setTimeout(() => {
		videoEnded.value = true
	}, 4000)
})
</script>

<template>
	<div
		id="splash-screen"
		class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-all duration-500"
		:class="leaving && 'opacity-0 scale-105'"
	>
		<!-- Dynamic logo video merging into pure black backdrop -->
		<video
			class="relative z-10 w-72 sm:w-80"
			autoplay
			muted
			playsinline
			@ended="onVideoEnd"
		>
			<source src="/gigglidedynamicm3.webm" type="video/webm" />
		</video>

		<!-- Get Started button -->
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
