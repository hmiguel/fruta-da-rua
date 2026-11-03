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

	<h3>{t('about.etiquette_title')}</h3>
	<p class="etiquette">{t('sheet.etiquette')}</p>
	<p class="small">{t('about.rules')}</p>

	<h3>{t('about.related')}</h3>
	<ul>
		<li><a href="https://fallingfruit.org" target="_blank" rel="noopener">Falling Fruit</a></li>
		<li>Muita Fruta (Cozinha Popular da Mouraria)</li>
	</ul>

	<p class="credit">
		{t('about.credit')}
		{#if dataDate}<br />{t('about.data_date', { date: dataDate })}{/if}
	</p>
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
	.etiquette {
		padding: 2px 0 2px 14px;
		border-left: 2px solid var(--ink);
		font-family: var(--font-hand);
		font-size: 1.05rem;
		line-height: 1.4;
		color: var(--pencil);
	}
	.small {
		margin-top: 10px;
		font-size: 0.9rem;
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
	.credit {
		margin-top: 20px;
		font-size: 0.85rem;
		color: var(--pencil);
	}
</style>
