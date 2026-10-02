<template>
	<!-- Fills the remaining page height; the image is absolutely positioned so it crops to fit -->
	<section class="relative flex-1 overflow-hidden">
		<img src="/handsome.png" alt="Portrait of a man in a white shirt"
			class="absolute inset-0 size-full object-cover object-top" />

		<div class="absolute inset-x-0 top-0 bg-linear-to-b from-black/80 to-transparent px-4 pt-4 pb-10">
			<h2 class="text-xl font-semibold drop-shadow">{{ name }}</h2>
			<p class="text-sm font-medium text-accent-soft drop-shadow">Match {{ match }}%</p>
		</div>

		<div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-4 pt-10 pb-4">
			<TechStackList :items="techStack" />
		</div>
	</section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TechStackList, { type Tech } from '@/components/TechStackList.vue'

const name = ref('Acme Robotics')
const match = ref(92)
const techStack = ref<Tech[]>([
	{ name: 'Vue', icon: 'vuedotjs' },
	{ name: 'TypeScript', icon: 'typescript' },
	{ name: 'Node.js', icon: 'nodedotjs' },
	{ name: 'PostgreSQL', icon: 'postgresql' },
	{ name: 'Docker', icon: 'docker' },
])
</script>
