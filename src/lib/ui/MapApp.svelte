<script lang="ts">
	import type { Feature, FeatureCollection, Point } from 'geojson';
	import { onMount } from 'svelte';
	import { countInBounds } from '$lib/counts.ts';
	import { LISBON_BBOX, type BBox } from '$lib/geo.ts';
	import { t } from '$lib/i18n/index.svelte.ts';
	import { enrich, matchesFilter, type EnrichedFC, type EnrichedProps } from '$lib/map/enrich.ts';
	import MapView from '$lib/map/MapView.svelte';
	import { lisbonMonth } from '$lib/season.ts';
	import { app } from '$lib/state.svelte.ts';
	import type { TreeProps } from '$lib/types.ts';
	import { speciesBySlug } from '$lib/site.ts';
	import { unpackTrees, type PackedTrees } from '$lib/trees-format.ts';
	import { i18n } from '$lib/i18n/index.svelte.ts';
	import About from './About.svelte';
	import SeasonPanel from './SeasonPanel.svelte';
	import TopBar from './TopBar.svelte';
	import TreeSheet from './TreeSheet.svelte';

	let now = $state(new Date());
	const month = $derived(lisbonMonth(now));

	let raw = $state.raw<FeatureCollection<Point, TreeProps> | null>(null);
	const trees: EnrichedFC | null = $derived(raw ? enrich(raw, now) : null);
	let failed = $state(false);
	let bounds = $state<BBox>(LISBON_BBOX);

	const counts = $derived(trees ? countInBounds(trees.features, bounds, app.selectedSpecies) : { pickable: [], soon: [], selected: null });
	const byId = $derived(
		new Map<string, Feature<Point, EnrichedProps>>(trees?.features.map((f) => [f.properties.id, f]) ?? [])
	);
	const selected = $derived(app.selectedTreeId ? byId.get(app.selectedTreeId) : undefined);

	onMount(async () => {
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
		// Arriving from a fruit page (`?fruta=nespera`): show that fruit's trees, in season or not.
		const fromPage = new URLSearchParams(location.search).get('fruta');
		const sp = fromPage ? speciesBySlug(fromPage, i18n.lang) : undefined;
		if (sp) {
			app.selectedSpecies = sp.id;
			app.onlyPickable = false;
		}
		if (new URLSearchParams(location.search).has('e2e')) {
			(window as unknown as { __openFirstTree: () => void }).__openFirstTree = () => {
				const f = trees?.features.find((f) => matchesFilter(f.properties, app.onlyPickable, app.selectedSpecies));
				if (f) app.selectedTreeId = f.properties.id;
			};
		}
	});
</script>

<main>
	<TopBar />
	{#if trees}
		<MapView {trees} onBounds={(b) => (bounds = b)} />
	{/if}
	<SeasonPanel {counts} {month} status={trees ? null : failed ? t('app.load_error') : t('app.loading')} />
	{#if selected}
		<TreeSheet tree={selected} {month} onClose={() => (app.selectedTreeId = null)} />
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
</style>
