<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n, t } from '../i18n/index.svelte.ts';
	import { REPO_URL, SPONSOR_URL } from '../site.ts';

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
	<p class="made">{t('about.made')}</p>

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

	<h3>{t('about.open_title')}</h3>
	<p>{t('about.open_body')}</p>
	<ul class="links">
		<li><a href={REPO_URL} target="_blank" rel="noopener" data-testid="repo">{t('about.code')}</a></li>
		<li><a href={SPONSOR_URL} target="_blank" rel="noopener" data-testid="sponsor">{t('about.sponsor')}</a></li>
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
	.made {
		margin-top: 10px;
		font-family: var(--font-hand);
		font-size: 1.1rem;
	}
	.links {
		margin-top: 4px;
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
