<script setup lang="ts">
import AppLogo from '@/components/AppLogo.vue'

const emit = defineEmits<{ menu: [] }>()
</script>

<template>
  <!-- Mobile only; the sidebar is permanently visible on lg+ -->
  <header
    class="retro-titlebar sticky top-0 z-10 flex h-14 items-center gap-3 px-4 lg:hidden"
  >
    <button
      class="retro-btn -ml-1 p-1"
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
