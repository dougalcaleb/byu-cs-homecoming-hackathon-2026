<template>
	<!-- Same surface column as the other pages -->
	<section class="mx-auto w-full max-w-2xl flex-1 space-y-8 border-x border-border bg-surface px-4 py-6">
		<header class="rise space-y-3">
			<AppLogo />
			<h1 class="text-3xl font-semibold tracking-tight">
				Job hunting, <span class="text-accent">minus the grind.</span>
			</h1>
			<p class="leading-relaxed text-neutral-300">
				Gig Glide is a dating app for job openings. Instead of scrolling through endless listings, you upload your
				resume once and swipe through postings picked for you: right if it sounds like a fit, left if it
				doesn't. The more you swipe, the better the picks get.
			</p>
		</header>

		<div class="space-y-3">
			<h2 class="rise text-lg font-semibold" style="animation-delay: 60ms">How it works</h2>
			<ol class="space-y-3">
				<li v-for="(step, index) in steps" :key="step.title"
					class="rise flex gap-4 rounded-2xl border border-border bg-card p-4"
					:style="{ animationDelay: 120 + index * 60 + 'ms' }">
					<span
						class="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
						{{ index + 1 }}
					</span>
					<div class="space-y-1">
						<h3 class="font-semibold">{{ step.title }}</h3>
						<p class="text-sm leading-relaxed text-neutral-300">{{ step.body }}</p>
					</div>
				</li>
			</ol>
		</div>

		<div class="space-y-3">
			<h2 class="rise text-lg font-semibold" style="animation-delay: 420ms">What you get</h2>
			<ul class="grid gap-3 sm:grid-cols-2">
				<li v-for="(feature, index) in features" :key="feature.title"
					class="rise rounded-2xl border border-border bg-card p-4"
					:style="{ animationDelay: 480 + index * 60 + 'ms' }">
					<h3 class="font-semibold text-accent-soft">{{ feature.title }}</h3>
					<p class="mt-1 text-sm leading-relaxed text-neutral-300">{{ feature.body }}</p>
				</li>
			</ul>
		</div>

		<footer class="rise space-y-2 border-t border-border pt-4 text-sm text-muted" style="animation-delay: 720ms">
			<p>
				Postings come from the career pages of real companies, so what you swipe on is what's actually open. Your
				resume is read in your browser and kept on your device; it is only used to rank jobs, never stored on our
				server.
			</p>
			<p>
				Built at the BYU CS Homecoming Hackathon 2026, on the prompt "improve the job hunt". Company logos by
				<a href="https://logo.dev" target="_blank" rel="noopener" class="text-accent-soft hover:underline">Logo.dev</a>.
			</p>
		</footer>
	</section>
</template>

<script setup lang="ts">
import AppLogo from '@/components/AppLogo.vue'

const steps = [
	{
		title: 'Upload your resume',
		body: 'Drop in a PDF or Word file. Gig Glide reads it right in your browser and builds a profile of your skills, experience and the kind of roles you are after. You can fix anything it got wrong.',
	},
	{
		title: 'Swipe through your matches',
		body: 'Each card is a real opening with the company, the role and the skills it asks for. Swipe left to pass. Swipe right to like it and open the full details.',
	},
	{
		title: 'Watch it learn your taste',
		body: 'Every swipe teaches the ranking. It weighs how well a job fits your resume and skills, how senior it is, where it is, and how similar it is to jobs you liked or passed on, so the next cards fit better.',
	},
	{
		title: 'Apply, and keep track',
		body: 'Apply opens the real application in a new tab. When you come back, we ask whether you actually applied and remember your answer, so nothing slips through the cracks.',
	},
]

const features = [
	{
		title: 'Matches ranked for you',
		body: 'Every card shows a match score and the skills the job asks for, so you can tell at a glance whether it is worth a closer look.',
	},
	{
		title: 'History you can use',
		body: 'Every job you swiped on is saved. Filter by liked, passed, applied, or liked but not applied yet, and jump back to any posting.',
	},
	{
		title: 'Ways to improve',
		body: 'For a job you want, see the gaps between your resume and the posting, with links to learn each skill.',
	},
	{
		title: 'Links that open the job',
		body: 'Every posting has its own link. Send it to a friend and they land right on it.',
	},
]
</script>
