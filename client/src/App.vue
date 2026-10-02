<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import AppTabBar from '@/components/AppTabBar.vue'
</script>

<template>
  <!-- Centered mobile-width column; the black body shows as negative space on wide screens -->
  <div class="mx-auto flex min-h-dvh w-full max-w-md flex-col border-x border-border bg-surface">
    <AppHeader />
    <main class="flex-1 px-4 py-4">
      <RouterView />
    </main>
    <AppTabBar />
  </div>
</template>
