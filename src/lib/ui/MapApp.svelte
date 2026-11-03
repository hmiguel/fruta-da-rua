<script lang="ts">
	import type { Feature, FeatureCollection, Point } from 'geojson';
	import { onMount } from 'svelte';
	import { filtersFromQuery, matchesFilter, readSaved, summarize, withFilters, writeSaved } from '$lib/filters.ts';
	import { LISBON_BBOX, type BBox } from '$lib/geo.ts';
	import { i18n, t } from '$lib/i18n/index.svelte.ts';
	import { enrich, type EnrichedFC, type EnrichedProps } from '$lib/map/enrich.ts';
	import MapView from '$lib/map/MapView.svelte';
	import { lisbonMonth } from '$lib/season.ts';
	import { app } from '$lib/state.svelte.ts';
	import type { TreeProps } from '$lib/types.ts';
	import { unpackTrees, type PackedTrees } from '$lib/trees-format.ts';
	import About from './About.svelte';
	import FruitChips from './FruitChips.svelte';
	import Menu from './Menu.svelte';
	import SearchBar from './SearchBar.svelte';
	import SummaryPanel from './SummaryPanel.svelte';
	import TreeSheet from './TreeSheet.svelte';

	let now = $state(new Date());
	const month = $derived(lisbonMonth(now));

	let raw = $state.raw<FeatureCollection<Point, TreeProps> | null>(null);
	const trees: EnrichedFC | null = $derived(raw ? enrich(raw, now) : null);
	let failed = $state(false);
	let bounds = $state<BBox>(LISBON_BBOX);
	let panelHeight = $state(0);
	let ready = $state(false);

	const summary = $derived(trees ? summarize(trees.features, bounds, app.filters) : { visible: 0, bySpecies: [] });
	const totals = $derived.by(() => {
		const m = new Map<string, number>();
		for (const f of trees?.features ?? []) m.set(f.properties.species, (m.get(f.properties.species) ?? 0) + 1);
		return m;
	});
	const byId = $derived(
		new Map<string, Feature<Point, EnrichedProps>>(trees?.features.map((f) => [f.properties.id, f]) ?? [])
	);
	const selected = $derived(app.selectedTreeId ? byId.get(app.selectedTreeId) : undefined);

	onMount(async () => {
		// A link (`?fruta=figo,nespera&epoca=0`) wins over what was chosen last time.
		app.filters = filtersFromQuery(location.search, i18n.lang) ?? readSaved(localStorage) ?? app.filters;
		ready = true;
		try {
			const res = await fetch('/trees.json');
			if (!res.ok) throw new Error(String(res.status));
			raw = unpackTrees((await res.json()) as PackedTrees);
		} catch {
			failed = true;
		}
		// An installed app can stay open for days: refresh seasons when it comes back into view.
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible' && lisbonMonth(new Date()) !== month) now = new Date();
		});
		if (new URLSearchParams(location.search).has('e2e')) {
			(window as unknown as { __openFirstTree: () => void }).__openFirstTree = () => {
				const f = trees?.features.find((f) => matchesFilter(f.properties, app.filters));
				if (f) app.selectedTreeId = f.properties.id;
			};
		}
	});

	// Remember the filters and keep them in the address, so a shared link shows the same map.
	$effect(() => {
		if (!ready) return;
		const f = app.filters;
		writeSaved(f, localStorage);
		const search = withFilters(location.search, f, i18n.lang);
		if (search !== location.search) history.replaceState(history.state, '', location.pathname + search + location.hash);
	});
</script>

<main style:--panel-h="{panelHeight}px">
	<h1 class="sr-only">{t('app.title')}</h1>
	<a class="skip" href="#fruit-search">{t('nav.skip')}</a>
	{#if trees}
		<MapView {trees} filters={app.filters} onBounds={(b) => (bounds = b)} />
	{/if}
	<div class="top">
		<SearchBar {now} {totals} />
		{#if trees && !app.searchOpen}
			<FruitChips counts={summary.bySpecies} />
		{/if}
	</div>
	<SummaryPanel
		bind:height={panelHeight}
		visible={summary.visible}
		status={trees ? null : failed ? t('app.load_error') : t('app.loading')}
	/>
	{#if selected}
		<TreeSheet tree={selected} {month} onClose={() => (app.selectedTreeId = null)} />
	{/if}
	{#if app.menuOpen}
		<Menu onClose={() => (app.menuOpen = false)} />
	{/if}
	{#if app.aboutOpen}
		<About onClose={() => (app.aboutOpen = false)} />
	{/if}
</main>

<style>
	main {
		position: fixed;
		inset: 0;
		overflow: hidden;
	}
	.top {
		position: absolute;
		z-index: 3;
		top: 0;
		left: 0;
		right: 0;
		padding: max(10px, env(safe-area-inset-top)) 12px 0;
		pointer-events: none;
	}
	@media (min-width: 768px) {
		.top {
			padding: 16px 16px 0;
		}
		.top > :global(.bar),
		.top > :global(.results) {
			max-width: 390px;
		}
	}
	.skip {
		position: absolute;
		left: 8px;
		top: -60px;
		z-index: 20;
		padding: 10px 14px;
		background: var(--sheet);
		border: 1.5px solid var(--ink);
		border-radius: 8px;
		color: var(--ink);
	}
	.skip:focus {
		top: 8px;
	}
</style>
