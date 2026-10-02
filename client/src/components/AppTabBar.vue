<script setup lang="ts">
const tabs = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
]
</script>

<template>
  <nav
    class="sticky bottom-0 z-10 flex h-14 border-t border-border bg-surface/90 backdrop-blur"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="flex flex-1 items-center justify-center text-sm text-muted transition-colors hover:text-white"
      active-class="!text-white font-medium"
    >
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>
