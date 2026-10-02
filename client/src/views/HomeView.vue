<template>
  <section class="space-y-4">
    <article
      v-for="n in 3"
      :key="n"
      class="rounded-xl border border-border bg-card p-4"
    >
      <h2 class="font-medium">Post {{ n }}</h2>
      <p class="mt-1 text-sm text-muted">Placeholder content.</p>
    </article>
  </section>
</template>
