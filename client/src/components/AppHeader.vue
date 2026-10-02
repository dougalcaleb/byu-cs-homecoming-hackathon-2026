<script setup lang="ts">
import AppLogo from '@/components/AppLogo.vue'

const emit = defineEmits<{ menu: [] }>()
</script>

<template>
  <!-- Mobile only; the sidebar is permanently visible on lg+ -->
  <header
    class="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur lg:hidden"
  >
    <button
      class="-ml-1 rounded-lg p-1.5 text-accent hover:bg-card"
      aria-label="Open menu"
      @click="emit('menu')"
    >
      <svg viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
    <AppLogo />
  </header>
</template>
