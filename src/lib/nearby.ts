import type { Feature, Point } from 'geojson';
import { matchesFilter, type Filters } from './filters.ts';
import { inBBox, type BBox } from './geo.ts';
import type { Lang } from './i18n/index.svelte.ts';
import type { EnrichedProps } from './map/enrich.ts';

type LngLat = readonly [number, number] | number[];
type Tree = Feature<Point, EnrichedProps>;

/** Great-circle distance in metres (haversine); plenty accurate across a city. */
export function distanceM([lon1, lat1]: LngLat, [lon2, lat2]: LngLat): number {
	const rad = Math.PI / 180;
	const a =
		Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
		Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
	return 2 * 6_371_000 * Math.asin(Math.sqrt(a));
}

/** "130 m", "1,2 km", "13 km": rounded the way people say distances on foot. */
export function formatDistance(m: number, lang: Lang): string {
	const locale = lang === 'en' ? 'en-GB' : 'pt-PT';
	if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m`;
	const km = m / 1000;
	return `${km.toLocaleString(locale, { maximumFractionDigits: km < 10 ? 1 : 0, minimumFractionDigits: km < 10 ? 1 : 0 })} km`;
}

/** The `limit` trees in view that pass the filters, closest to `from` first; `total` counts them all. */
export function nearest(trees: Tree[], bounds: BBox, f: Filters, from: LngLat, limit: number) {
	const all: { tree: Tree; metres: number }[] = [];
	for (const tree of trees) {
		if (!inBBox(tree.geometry.coordinates, bounds) || !matchesFilter(tree.properties, f)) continue;
		all.push({ tree, metres: distanceM(from, tree.geometry.coordinates) });
	}
	all.sort((a, b) => a.metres - b.metres);
	return { items: all.slice(0, limit), total: all.length };
}
