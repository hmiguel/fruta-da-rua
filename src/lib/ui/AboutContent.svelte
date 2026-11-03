<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n, t } from '../i18n/index.svelte.ts';

	let generatedAt: string | null = $state(null);
	const dataDate = $derived(
		generatedAt
			? new Date(generatedAt).toLocaleDateString(i18n.lang === 'en' ? 'en-GB' : 'pt-PT', { dateStyle: 'long' })
			: null
	);

	onMount(() => {
		fetch('/meta.json')
			.then((r) => r.json())
			.then((m) => (generatedAt = m.generated_at))
			.catch(() => {});
	});
</script>

<div class="about" data-testid="about">
	<p>{t('about.body')}</p>

	<h3>{t('about.data_title')}</h3>
	<p>
		{t('about.source')}
		{#if dataDate}<br /><span class="date">{t('about.data_date', { date: dataDate })}</span>{/if}
	</p>

	<h3>{t('about.related')}</h3>
	<ul>
		<li><a href="https://fallingfruit.org" target="_blank" rel="noopener">Falling Fruit</a></li>
		<li>Muita Fruta (Cozinha Popular da Mouraria)</li>
	</ul>
</div>

<style>
	.about {
		padding: 0 20px 8px;
	}
	p {
		margin: 0;
	}
	h3 {
		margin: 20px 0 6px;
		font-family: var(--font-hand);
		font-weight: 400;
		font-size: 1.15rem;
		color: var(--pencil);
	}
	.date {
		color: var(--pencil);
	}
	ul {
		margin: 0;
		padding-left: 18px;
	}
	li a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		color: var(--ink);
	}
</style>
