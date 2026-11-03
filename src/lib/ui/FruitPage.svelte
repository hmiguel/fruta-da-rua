<script lang="ts">
	import { onMount } from 'svelte';
	import FruitArt from '../art/FruitArt.svelte';
	import { filtersToQuery } from '../filters.ts';
	import type { FruitStats } from '../fruit-stats.ts';
	import { monthsSentence } from '../fruit-stats.ts';
	import { i18n, speciesName, speciesNote, t, tn, treeName } from '../i18n/index.svelte.ts';
	import { lisbonMonth } from '../season.ts';
	import { EDIBLE, SITE_NAME, absoluteUrl, calendarPath, fruitPath, homePath } from '../site.ts';
	import { speciesById } from '../species.ts';
	import MonthsBar from './MonthsBar.svelte';
	import Seo from './Seo.svelte';
	import SiteFooter from './SiteFooter.svelte';
	import SiteHeader from './SiteHeader.svelte';

	let { speciesId, stats }: { speciesId: string; stats: FruitStats } = $props();

	const sp = $derived(speciesById(speciesId)!);
	const name = $derived(speciesName(sp));
	const months = $derived(monthsSentence(sp.ripe, i18n.lang));
	const mapHref = $derived(homePath(i18n.lang) + filtersToQuery({ species: [sp.id], onlyPickable: false }, i18n.lang));
	const others = $derived(EDIBLE.filter((s) => s.id !== sp.id));

	// The current month is only known in the browser (pages are generated ahead of time).
	let month = $state(0);
	onMount(() => (month = lisbonMonth(new Date())));

	const directions = (lat: number, lng: number) =>
		`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
</script>

<Seo
	title={t('seo.fruit_title', { name })}
	description={t('seo.fruit_description', {
		n: stats.count,
		trees: treeName(sp, stats.count),
		name,
		name_lower: name.toLowerCase(),
		months
	})}
	image="/og/{sp.id}.png"
	jsonLd={[
		{
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: t('crumb.home'), item: absoluteUrl(homePath(i18n.lang)) },
				{ '@type': 'ListItem', position: 2, name: t('crumb.calendar'), item: absoluteUrl(calendarPath(i18n.lang)) },
				{ '@type': 'ListItem', position: 3, name, item: absoluteUrl(fruitPath(sp, i18n.lang)) }
			]
		},
		{
			'@context': 'https://schema.org',
			'@type': 'WebPage',
			name: t('seo.fruit_title', { name }),
			isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: absoluteUrl('/') },
			about: { '@type': 'Thing', name, alternateName: sp.match[0].replace(/^./, (c) => c.toUpperCase()) }
		}
	]}
/>

<SiteHeader />

<main id="main" tabindex="-1">
	<nav class="crumbs" aria-label="Breadcrumb">
		<a href={homePath(i18n.lang)}>{t('crumb.home')}</a>
		<span aria-hidden="true">/</span>
		<a href={calendarPath(i18n.lang)}>{t('crumb.calendar')}</a>
		<span aria-hidden="true">/</span>
		<span aria-current="page">{name}</span>
	</nav>

	<header class="plate">
		<FruitArt species={sp} size={112} eager />
		<div>
			<h1>{name}</h1>
			<p class="sci"><i>{sp.match[0].replace(/^./, (c) => c.toUpperCase())}</i></p>
			<p class="tag">{t(`tier.${sp.tier}`)}</p>
		</div>
	</header>

	<a class="cta" href={mapHref} data-testid="see-map">{t('fruit.see_map')} ({tn('panel.trees', stats.count)})</a>

	<section aria-labelledby="when">
		<h2 id="when">{t('fruit.when')}</h2>
		<MonthsBar species={sp} {month} labels />
		<p>
			{t('fruit.when_text', { months })}
			{#if sp.peak.length < sp.ripe.length}{t('fruit.peak_text', { months: monthsSentence(sp.peak, i18n.lang) })}{/if}
			<span class="estimate">({t('app.estimate').toLowerCase()})</span>
		</p>
	</section>

	<section aria-labelledby="how">
		<h2 id="how">{t('fruit.how')}</h2>
		<p>{speciesNote(sp)}</p>
		<p class="etiquette">{t('sheet.etiquette')}</p>
	</section>

	<section aria-labelledby="where">
		<h2 id="where">{t('fruit.where', { trees: treeName(sp, 2) })}</h2>
		<p>{t('fruit.where_text', { n: stats.count, trees: treeName(sp, stats.count) })}</p>
		<ul class="parishes">
			{#each stats.parishes as p (p.name)}
				<li>
					<details>
						<summary>
							<span>{p.name ?? t('fruit.no_parish')}</span>
							<span class="n">{tn('panel.trees', p.trees.length)}</span>
						</summary>
						<ul class="trees">
							{#each p.trees as tree (tree.id)}
								<li>
									<span>{tree.address ?? t('fruit.no_address')}</span>
									<a href={directions(tree.lat, tree.lng)} target="_blank" rel="noopener"
										>{t('sheet.directions')}<span class="sr-only">: {tree.address ?? name}</span></a
									>
								</li>
							{/each}
						</ul>
					</details>
				</li>
			{/each}
		</ul>
	</section>

	<nav class="others" aria-labelledby="others">
		<h2 id="others">{t('fruit.others')}</h2>
		<ul>
			{#each others as o (o.id)}
				<li>
					<a href={fruitPath(o, i18n.lang)}><FruitArt species={o} size={40} /><span>{speciesName(o)}</span></a>
				</li>
			{/each}
		</ul>
	</nav>
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
	.crumbs {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		font-size: 0.9rem;
		color: var(--pencil);
	}
	.crumbs a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
		color: var(--ink);
	}
	.plate {
		display: flex;
		align-items: center;
		gap: 14px;
		margin: 4px 0 16px;
	}
	h1 {
		margin: 0;
		font-family: var(--font-hand);
		font-weight: 700;
		font-size: 2.3rem;
		line-height: 1.1;
	}
	.sci {
		margin: 2px 0 0;
		color: var(--pencil);
	}
	.tag {
		display: inline-block;
		margin: 8px 0 0;
		padding: 2px 12px;
		background: var(--tag);
		border-radius: 3px 10px 10px 3px;
		font-size: 0.9rem;
	}
	.cta {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 52px;
		padding: 8px 16px;
		border: 1.5px solid var(--ink);
		border-radius: 12px 14px 12px 16px;
		background: var(--wash);
		color: var(--ink);
		font-family: var(--font-hand);
		font-size: 1.2rem;
		font-weight: 700;
		text-align: center;
		text-decoration: none;
	}
	section {
		margin-top: 28px;
	}
	h2 {
		margin: 0 0 10px;
		font-family: var(--font-hand);
		font-weight: 700;
		font-size: 1.5rem;
		line-height: 1.2;
	}
	p {
		margin: 10px 0 0;
	}
	.estimate {
		color: var(--pencil);
	}
	.etiquette {
		padding: 2px 0 2px 14px;
		border-left: 2px solid var(--ink);
		font-family: var(--font-hand);
		font-size: 1.1rem;
		color: var(--pencil);
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.parishes {
		margin-top: 12px;
		border-top: 1px solid var(--rule);
	}
	.parishes > li {
		border-bottom: 1px solid var(--rule);
	}
	summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		min-height: 48px;
		cursor: pointer;
		font-size: 1.05rem;
	}
	summary .n {
		color: var(--pencil);
		white-space: nowrap;
	}
	.trees li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 2px 0 2px 12px;
		border-left: 2px solid var(--rule);
	}
	.trees a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		white-space: nowrap;
		color: var(--ink);
	}
	.others {
		margin-top: 32px;
	}
	.others ul {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 4px 12px;
	}
	.others a {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 48px;
		font-family: var(--font-hand);
		font-size: 1.1rem;
		color: var(--ink);
		text-decoration: none;
	}
</style>
