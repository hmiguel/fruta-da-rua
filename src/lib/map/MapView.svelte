<script lang="ts">
	import type { GeoJSONSource, Map as MapLibreMap, MapGeoJSONFeature } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { onMount } from 'svelte';
	import { LISBON_BBOX, inBBox, type BBox } from '../geo.ts';
	import { t } from '../i18n/index.svelte.ts';
	import { app } from '../state.svelte.ts';
	import { matchesFilter, type EnrichedFC } from './enrich.ts';
	import { keepLayer, naturePaint } from './nature-style.ts';
	import { SPECIES } from '../species.ts';

	let { trees, onBounds }: { trees: EnrichedFC; onBounds: (b: BBox) => void } = $props();

	let container: HTMLDivElement;
	let map: MapLibreMap | undefined = $state();
	let loaded = $state(false);

	const [w, s, e, n] = LISBON_BBOX;
	const PAD = 0.15;

	/** Keep Lisbon clear of the top bar and the season panel (bottom sheet on phones, sidebar on desktop). */
	function framePadding() {
		const wide = window.innerWidth >= 768;
		return wide
			? { top: 80, bottom: 20, left: 410, right: 20 }
			: { top: 110, bottom: Math.round(window.innerHeight * 0.4) + 10, left: 10, right: 10 };
	}

	const INK = '#3a3226';
	const PAPER_SHEET = '#f7f8f0';

	/** Registers each fruit's watercolour illustration as a map icon (`fruit-<id>`). */
	async function addFruitImages(m: MapLibreMap) {
		await Promise.all(
			SPECIES.filter((sp) => sp.tier !== 'excluded').map(async (sp) => {
				const { data } = await m.loadImage(`/art/sm/${sp.id}.webp`);
				if (!m.hasImage(`fruit-${sp.id}`)) m.addImage(`fruit-${sp.id}`, data, { pixelRatio: 2 });
			})
		);
	}

	function emitBounds() {
		const b = map!.getBounds();
		onBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
	}

	onMount(() => {
		let instance: MapLibreMap | undefined;
		let destroyed = false;
		// MapLibre needs the browser, so it loads only here (pages are prerendered on the server).
		import('maplibre-gl').then(({ default: maplibregl }) => {
			if (destroyed) return;
			const m = new maplibregl.Map({
				container,
				bounds: [w, s, e, n],
				fitBoundsOptions: { padding: framePadding() },
				maxBounds: [w - PAD, s - PAD, e + PAD, n + PAD],
				attributionControl: false,
				locale: { 'GeolocateControl.FindMyLocation': t('locate') }
			});
			m.setStyle('https://tiles.openfreemap.org/styles/liberty', {
				transformStyle: (_, next) => ({
					...next,
					layers: next.layers
						.filter((layer) => keepLayer(layer.id))
						.map((layer) => {
							const paint = naturePaint(layer.id, layer.type);
							return paint && 'paint' in layer
								? ({ ...layer, paint: { ...layer.paint, ...Object.fromEntries(paint) } } as typeof layer)
								: layer;
						})
				})
			});
			m.addControl(
				new maplibregl.AttributionControl({
					compact: true,
					customAttribution: '© Câmara Municipal de Lisboa (CC0) · OpenFreeMap © OpenStreetMap'
				}),
				'bottom-right'
			);
			const geolocate = new maplibregl.GeolocateControl({
				positionOptions: { enableHighAccuracy: true },
				trackUserLocation: true,
				fitBoundsOptions: { maxZoom: 16 }
			});
			m.addControl(geolocate, 'top-right');

			m.on('load', async () => {
				await addFruitImages(m);
				m.addSource('trees', {
					type: 'geojson',
					data: { type: 'FeatureCollection', features: [] },
					cluster: true,
					clusterRadius: 32,
					clusterMaxZoom: 13
				});
				m.addLayer({
					id: 'clusters',
					type: 'circle',
					source: 'trees',
					filter: ['has', 'point_count'],
					paint: {
						'circle-color': PAPER_SHEET,
						'circle-radius': ['step', ['get', 'point_count'], 14, 20, 18, 100, 23],
						'circle-stroke-color': INK,
						'circle-stroke-width': 1.5
					}
				});
				m.addLayer({
					id: 'cluster-count',
					type: 'symbol',
					source: 'trees',
					filter: ['has', 'point_count'],
					layout: {
						'text-field': ['get', 'point_count_abbreviated'],
						'text-size': 13,
						'text-font': ['Noto Sans Regular']
					},
					paint: { 'text-color': INK }
				});
				m.addLayer({
					id: 'tree',
					type: 'symbol',
					source: 'trees',
					filter: ['!', ['has', 'point_count']],
					layout: {
						'icon-image': ['concat', 'fruit-', ['get', 'species']],
						'icon-size': ['interpolate', ['linear'], ['zoom'], 12, 0.55, 15, 0.8, 18, 1.2],
						'icon-allow-overlap': true
					},
					paint: { 'icon-opacity': ['case', ['get', 'pickable'], 1, 0.4] }
				});
				m.addLayer({
					id: 'tree-selected',
					type: 'circle',
					source: 'trees',
					filter: ['==', ['get', 'id'], ''],
					paint: {
						'circle-color': 'transparent',
						'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 15, 15, 19, 18, 28],
						'circle-stroke-color': INK,
						'circle-stroke-width': 2
					}
				});

				m.on('click', 'clusters', async (ev) => {
					const f = ev.features?.[0] as MapGeoJSONFeature | undefined;
					if (!f) return;
					const src = m.getSource('trees') as GeoJSONSource;
					const zoom = await src.getClusterExpansionZoom(f.properties.cluster_id);
					m.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
				});
				m.on('click', 'tree', (ev) => {
					const id = ev.features?.[0]?.properties.id;
					if (id) app.selectedTreeId = String(id);
				});
				for (const layer of ['clusters', 'tree']) {
					m.on('mouseenter', layer, () => (m.getCanvas().style.cursor = 'pointer'));
					m.on('mouseleave', layer, () => (m.getCanvas().style.cursor = ''));
				}
				m.on('moveend', emitBounds);
				loaded = true;
				emitBounds();

				// Centre on the user only if they already granted location and are in Lisbon.
				navigator.permissions
					?.query({ name: 'geolocation' })
					.then((p) => {
						if (p.state !== 'granted') return;
						navigator.geolocation.getCurrentPosition((pos) => {
							if (inBBox([pos.coords.longitude, pos.coords.latitude], LISBON_BBOX)) geolocate.trigger();
						});
					})
					.catch(() => {});
			});
			m.getCanvas().setAttribute('aria-label', t('map.label'));
			map = instance = m;
		});
		return () => {
			destroyed = true;
			instance?.remove();
		};
	});

	$effect(() => {
		if (!map || !loaded) return;
		const { onlyPickable, selectedSpecies } = app;
		const features = trees.features.filter((f) => matchesFilter(f.properties, onlyPickable, selectedSpecies));
		(map.getSource('trees') as GeoJSONSource).setData({ type: 'FeatureCollection', features });
	});

	$effect(() => {
		if (!map || !loaded) return;
		map.setFilter('tree-selected', ['==', ['get', 'id'], app.selectedTreeId ?? '']);
	});
</script>

<div class="map" bind:this={container}></div>

<style>
	.map {
		position: absolute;
		inset: 0;
	}
	.map :global(.maplibregl-ctrl-top-right) {
		top: 104px;
	}
	/* Thumb-sized map controls on phones. */
	.map :global(.maplibregl-ctrl-group button) {
		width: 44px;
		height: 44px;
	}
	.map :global(.maplibregl-ctrl-attrib-button) {
		width: 44px;
		height: 44px;
		background-position: center;
	}
	.map :global(.maplibregl-ctrl-attrib.maplibregl-compact) {
		min-height: 44px;
	}
</style>
