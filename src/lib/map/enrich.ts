import type { FeatureCollection, Point } from 'geojson';
import { seasonStatus, isPickable } from '../season.ts';
import { speciesById } from '../species.ts';
import type { Status, TreeProps } from '../types.ts';

export const OUT_COLOR = '#9ca3af';

export type EnrichedProps = TreeProps & { status: Status; color: string; pickable: boolean };
export type EnrichedFC = FeatureCollection<Point, EnrichedProps>;

export function enrich(fc: FeatureCollection<Point, TreeProps>, now: Date): EnrichedFC {
	const features = [];
	for (const f of fc.features) {
		const sp = speciesById(f.properties.species);
		if (!sp || sp.tier === 'excluded') continue;
		const status = seasonStatus(sp, now);
		const pickable = isPickable(status);
		features.push({ ...f, properties: { ...f.properties, status, pickable, color: pickable ? sp.color : OUT_COLOR } });
	}
	return { type: 'FeatureCollection', features };
}
