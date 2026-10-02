<script setup lang="ts">
export interface Tech {
	name: string
	/** Simple Icons slug, e.g. "vuedotjs" (https://simpleicons.org) */
	icon: string
}

defineProps<{ items: Tech[] }>()
</script>

<template>
	<ul class="flex flex-wrap gap-2">
		<li v-for="tech in items" :key="tech.name"
			class="flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium backdrop-blur">
			<img :src="`https://cdn.simpleicons.org/${tech.icon}/white`" :alt="`${tech.name} logo`" class="size-4" />
			{{ tech.name }}
		</li>
	</ul>
</template>
