import type { FeatureCollection, Point } from 'geojson';
import type { TreeProps } from './types.ts';

/**
 * Compact form of the tree data served to phones (static/trees.json): species and parish
 * names are listed once and trees refer to them by index. Coordinates keep 5 decimals (~1 m).
 * Row: [id, speciesIndex, parishIndex or -1, address or null, lng, lat]
 */
export interface PackedTrees {
	species: string[];
	parishes: string[];
	trees: [string, number, number, string | null, number, number][];
}

const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

export function packTrees(fc: FeatureCollection<Point, TreeProps>): PackedTrees {
	const species: string[] = [];
	const parishes: string[] = [];
	const index = (list: string[], v: string) => {
		const i = list.indexOf(v);
		return i >= 0 ? i : list.push(v) - 1;
	};
	const trees = fc.features.map((f): PackedTrees['trees'][number] => {
		const p = f.properties;
		const [lng, lat] = f.geometry.coordinates;
		return [p.id, index(species, p.species), p.parish ? index(parishes, p.parish) : -1, p.address, round5(lng), round5(lat)];
	});
	return { species, parishes, trees };
}

export function unpackTrees(p: PackedTrees): FeatureCollection<Point, TreeProps> {
	return {
		type: 'FeatureCollection',
		features: p.trees.map(([id, s, parish, address, lng, lat]) => ({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [lng, lat] },
			properties: { id, species: p.species[s], address, parish: parish >= 0 ? p.parishes[parish] : null, source: 'city' }
		}))
	};
}
