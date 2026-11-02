import { expect, test } from 'vitest';
import { countInBounds } from './counts.ts';
import type { EnrichedProps } from './map/enrich.ts';
import type { Status } from './types.ts';

const f = (species: string, status: Status, lon = -9.14, lat = 38.72) => ({
	type: 'Feature' as const,
	geometry: { type: 'Point' as const, coordinates: [lon, lat] },
	properties: {
		id: species + lon,
		species,
		status,
		pickable: status === 'in_season' || status === 'ripe',
		color: '#000',
		address: null,
		parish: null,
		source: 'city' as const
	} satisfies EnrichedProps
});

const bounds = [-9.2, 38.7, -9.1, 38.75] as const;

test('counts only features inside bounds, sorted by count', () => {
	const r = countInBounds(
		[f('olive', 'in_season'), f('pomegranate', 'in_season'), f('olive', 'in_season'), f('olive', 'in_season', -8.6, 41.1)],
		bounds
	);
	expect(r.pickable).toEqual([
		{ species: 'olive', count: 2 },
		{ species: 'pomegranate', count: 1 }
	]);
});

test('separates soon from pickable and ignores out', () => {
	const r = countInBounds([f('orange', 'soon'), f('fig', 'out'), f('olive', 'ripe')], bounds);
	expect(r.pickable).toEqual([{ species: 'olive', count: 1 }]);
	expect(r.soon).toEqual([{ species: 'orange', count: 1 }]);
});

test('a selected out-of-season fruit is counted separately so the panel can show it', () => {
	const r = countInBounds([f('fig', 'out'), f('fig', 'out'), f('olive', 'in_season')], bounds, 'fig');
	expect(r.selected).toEqual({ species: 'fig', count: 2 });
	expect(countInBounds([f('olive', 'in_season')], bounds, 'olive').selected).toBeNull();
	expect(countInBounds([f('olive', 'in_season')], bounds).selected).toBeNull();
});
