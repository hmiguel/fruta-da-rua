import type { Feature, Point } from 'geojson';
import { inBBox, type BBox } from './geo.ts';
import type { EnrichedProps } from './map/enrich.ts';

export interface SpeciesCount {
	species: string;
	count: number;
}

function sorted(m: Map<string, number>): SpeciesCount[] {
	return [...m].map(([species, count]) => ({ species, count })).sort((a, b) => b.count - a.count);
}

/** `selected`: a chosen fruit that is neither pickable nor coming soon, counted on its own. */
export function countInBounds(features: Feature<Point, EnrichedProps>[], bounds: BBox, selectedId?: string | null) {
	const pickable = new Map<string, number>();
	const soon = new Map<string, number>();
	let selectedOut = 0;
	for (const f of features) {
		if (!inBBox(f.geometry.coordinates, bounds)) continue;
		if (f.properties.species === selectedId && f.properties.status === 'out') selectedOut++;
		const target = f.properties.pickable ? pickable : f.properties.status === 'soon' ? soon : null;
		target?.set(f.properties.species, (target.get(f.properties.species) ?? 0) + 1);
	}
	const selected = selectedId && selectedOut ? { species: selectedId, count: selectedOut } : null;
	return { pickable: sorted(pickable), soon: sorted(soon), selected };
}
