import type { Feature, Point } from 'geojson';
import { LISBON_BBOX, inBBox } from '../src/lib/geo.ts';
import { matchSpecies } from '../src/lib/species.ts';
import type { Species, TreeProps } from '../src/lib/types.ts';

export { LISBON_BBOX };

export const CITY_LAYER =
	'https://services.arcgis.com/1dSrzEWVQn5kHHyK/arcgis/rest/services/Ambiente_DMEVAE/FeatureServer/0';

export interface ArcFeature {
	type: 'Feature';
	geometry: { type: 'Point'; coordinates: [number, number] } | null;
	properties: Record<string, unknown>;
}

export type TreeFeature = Feature<Point, TreeProps>;

function text(v: unknown): string | null {
	if (typeof v !== 'string') return null;
	const t = v.trim();
	return t === '' || t.toUpperCase() === 'NULL' ? null : t;
}

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

export function toTreeFeature(f: ArcFeature, list: Species[]): TreeFeature | null {
	const c = f.geometry?.coordinates;
	if (!c || !Number.isFinite(c[0]) || !Number.isFinite(c[1]) || !inBBox(c, LISBON_BBOX)) return null;
	const sp = matchSpecies(text(f.properties.ESPECIE_VA), list);
	if (!sp || sp.tier === 'excluded') return null;
	const id = text(f.properties.COD_SIG_NEW) ?? text(f.properties.GlobalID);
	if (!id) return null;
	return {
		type: 'Feature',
		geometry: { type: 'Point', coordinates: [round6(c[0]), round6(c[1])] },
		properties: {
			id,
			species: sp.id,
			address: text(f.properties.MORADA),
			parish: text(f.properties.FREG_2012),
			source: 'city'
		}
	};
}

export async function fetchAllCity(fetchFn: typeof fetch, pageSize = 2000): Promise<ArcFeature[]> {
	const all: ArcFeature[] = [];
	for (let offset = 0; ; ) {
		const url =
			`${CITY_LAYER}/query?where=1%3D1&outFields=COD_SIG_NEW,MORADA,ESPECIE_VA,FREG_2012,GlobalID` +
			`&outSR=4326&f=geojson&orderByFields=GESP_C_PK&resultOffset=${offset}&resultRecordCount=${pageSize}`;
		const res = await fetchFn(url);
		if (!res.ok) throw new Error(`City API ${res.status} at offset ${offset}`);
		const body = await res.json();
		if (body.error) throw new Error(`City API error: ${JSON.stringify(body.error)}`);
		const features: ArcFeature[] = body.features ?? [];
		const exceeded = body.exceededTransferLimit === true || body.properties?.exceededTransferLimit === true;
		all.push(...features);
		offset += features.length;
		if (features.length === 0 || (features.length < pageSize && !exceeded)) return all;
	}
}

export function summarize(features: TreeFeature[]) {
	const by_species: Record<string, number> = {};
	for (const f of features) by_species[f.properties.species] = (by_species[f.properties.species] ?? 0) + 1;
	return { generated_at: new Date().toISOString(), count: features.length, by_species };
}
