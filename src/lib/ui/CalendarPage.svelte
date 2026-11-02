<script lang="ts">
	import { onMount } from 'svelte';
	import FruitArt from '../art/FruitArt.svelte';
	import { monthsSentence } from '../fruit-stats.ts';
	import { i18n, monthShort, speciesName, t } from '../i18n/index.svelte.ts';
	import { lisbonMonth } from '../season.ts';
	import { EDIBLE, absoluteUrl, calendarPath, fruitPath, homePath } from '../site.ts';
	import MonthsBar from './MonthsBar.svelte';
	import Seo from './Seo.svelte';
	import SiteFooter from './SiteFooter.svelte';
	import SiteHeader from './SiteHeader.svelte';

	const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
	// In harvest order through the year, starting with what ripens first.
	const fruits = $derived(
		[...EDIBLE].sort((a, b) => a.ripe[0] - b.ripe[0] || speciesName(a).localeCompare(speciesName(b), 'pt'))
	);

	let month = $state(0);
	onMount(() => (month = lisbonMonth(new Date())));
</script>

<Seo
	title={t('seo.calendar_title')}
	description={t('seo.calendar_description')}
	jsonLd={[
		{
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: t('crumb.home'), item: absoluteUrl(homePath(i18n.lang)) },
				{ '@type': 'ListItem', position: 2, name: t('crumb.calendar'), item: absoluteUrl(calendarPath(i18n.lang)) }
			]
		},
		{
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			itemListElement: fruits.map((s, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: speciesName(s),
				url: absoluteUrl(fruitPath(s, i18n.lang))
			}))
		}
	]}
/>

<SiteHeader />

<main id="main" tabindex="-1">
	<h1>{t('calendar.title')}</h1>
	<p class="intro">{t('calendar.intro')}</p>

	<div class="months" aria-hidden="true">
		{#each MONTHS as m (m)}<span class:now={m === month}>{monthShort(m).slice(0, 1)}</span>{/each}
	</div>
	<ul>
		{#each fruits as s (s.id)}
			<li>
				<a href={fruitPath(s, i18n.lang)}>
					<FruitArt species={s} size={44} />
					<span class="name">
						<span class="fruit">{speciesName(s)}</span>
						<span class="when">{monthsSentence(s.ripe, i18n.lang)}</span>
					</span>
					<span class="strip"><MonthsBar species={s} {month} /></span>
				</a>
			</li>
		{/each}
	</ul>
</main>

<SiteFooter />

<style>
	main {
		max-width: 760px;
		margin: 0 auto;
		padding: 0 16px 24px;
	}
	main:focus {
		outline: none;
	}
	h1 {
		margin: 8px 0 0;
		font-family: var(--font-hand);
		font-weight: 700;
		font-size: 2.1rem;
		line-height: 1.15;
	}
	.intro {
		margin: 8px 0 18px;
	}
	.months,
	a {
		--strip: min(120px, 32vw);
	}
	.months {
		display: grid;
		grid-template-columns: repeat(12, 1fr);
		width: var(--strip);
		margin-left: auto;
		font-size: 11px;
		text-align: center;
		color: var(--pencil);
	}
	.months .now {
		color: var(--ink);
		font-weight: 600;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li {
		border-top: 1px solid var(--rule);
	}
	a {
		display: grid;
		grid-template-columns: 44px 1fr var(--strip);
		align-items: center;
		gap: 10px;
		min-height: 56px;
		padding: 4px 0;
		color: var(--ink);
		text-decoration: none;
	}
	.name {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.fruit {
		font-family: var(--font-hand);
		font-size: 1.2rem;
		line-height: 1.2;
		text-decoration: underline;
		text-decoration-color: var(--rule);
		text-underline-offset: 4px;
	}
	.when {
		font-size: 0.85rem;
		color: var(--pencil);
	}
</style>
