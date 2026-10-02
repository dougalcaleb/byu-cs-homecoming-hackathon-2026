<script setup lang="ts">
import { ref } from 'vue'
import type { Contact } from '@/types'

const props = defineProps<{ contact: Contact }>()

const newLink = ref('')

function addLink() {
	const url = newLink.value.trim()
	if (url && !props.contact.links.includes(url)) {
		props.contact.links.push(url)
	}
	newLink.value = ''
}

function removeLink(index: number) {
	props.contact.links.splice(index, 1)
}
</script>

<template>
	<div class="flex flex-col gap-6">
		<div class="text-center">
			<h2 class="text-xl font-semibold text-neutral-100">Contact Info</h2>
			<p class="mt-1 text-sm text-muted">Review and edit your contact details</p>
		</div>

		<div class="flex flex-col gap-4">
			<!-- Name -->
			<div>
				<label class="mb-1.5 block text-xs font-medium text-muted" for="contact-name">
					Full Name
				</label>
				<input
					id="contact-name"
					v-model="contact.name"
					type="text"
					placeholder="John Doe"
					class="w-full rounded-xl border border-border/60 bg-page/40 px-4 py-3 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/40 focus:border-accent focus:ring-1 focus:ring-accent/50"
				/>
			</div>

			<!-- Email -->
			<div>
				<label class="mb-1.5 block text-xs font-medium text-muted" for="contact-email">
					Email
				</label>
				<input
					id="contact-email"
					v-model="contact.email"
					type="email"
					placeholder="you@example.com"
					class="w-full rounded-xl border border-border/60 bg-page/40 px-4 py-3 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/40 focus:border-accent focus:ring-1 focus:ring-accent/50"
				/>
			</div>

			<!-- Phone & Location (side by side) -->
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="mb-1.5 block text-xs font-medium text-muted" for="contact-phone">
						Phone
					</label>
					<input
						id="contact-phone"
						v-model="contact.phone"
						type="tel"
						placeholder="(555) 123-4567"
						class="w-full rounded-xl border border-border/60 bg-page/40 px-4 py-3 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/40 focus:border-accent focus:ring-1 focus:ring-accent/50"
					/>
				</div>
				<div>
					<label
						class="mb-1.5 block text-xs font-medium text-muted"
						for="contact-location"
					>
						Location
					</label>
					<input
						id="contact-location"
						v-model="contact.location"
						type="text"
						placeholder="Provo, UT"
						class="w-full rounded-xl border border-border/60 bg-page/40 px-4 py-3 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/40 focus:border-accent focus:ring-1 focus:ring-accent/50"
					/>
				</div>
			</div>

			<!-- Links -->
			<div>
				<label class="mb-1.5 block text-xs font-medium text-muted">Links</label>
				<div v-if="contact.links.length" class="mb-2 flex flex-col gap-1.5">
					<div
						v-for="(link, i) in contact.links"
						:key="i"
						class="flex items-center gap-2 rounded-lg border border-border/40 bg-page/30 px-3 py-2"
					>
						<svg
							class="size-3.5 shrink-0 text-accent/60"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
							<path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
						</svg>
						<span class="min-w-0 flex-1 truncate text-xs text-neutral-300">
							{{ link }}
						</span>
						<button
							class="shrink-0 rounded p-0.5 text-muted transition-colors hover:text-red-400"
							aria-label="Remove link"
							@click="removeLink(i)"
						>
							<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>
				</div>
				<div class="flex gap-2">
					<input
						v-model="newLink"
						type="url"
						placeholder="https://linkedin.com/in/..."
						class="min-w-0 flex-1 rounded-xl border border-border/60 bg-page/40 px-4 py-2.5 text-sm text-neutral-100 outline-none transition-colors placeholder:text-muted/40 focus:border-accent focus:ring-1 focus:ring-accent/50"
						@keydown.enter.prevent="addLink"
					/>
					<button
						class="shrink-0 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-border hover:text-neutral-200"
						@click="addLink"
					>
						Add
					</button>
				</div>
			</div>
		</div>
	</div>
</template>
