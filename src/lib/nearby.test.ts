import { expect, test } from 'vitest';
import { distanceM, formatDistance, nearest } from './nearby.ts';
import type { EnrichedProps } from './map/enrich.ts';
import type { Status } from './types.ts';

const f = (id: string, species: string, status: Status, lon: number, lat: number) => ({
	type: 'Feature' as const,
	geometry: { type: 'Point' as const, coordinates: [lon, lat] },
	properties: {
		id,
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
const here: [number, number] = [-9.14, 38.72];

test('distance between two points in Lisbon, in metres', () => {
	// Praça do Comércio to Rossio is about 700 m.
	expect(distanceM([-9.1366, 38.7077], [-9.1393, 38.7139])).toBeGreaterThan(650);
	expect(distanceM([-9.1366, 38.7077], [-9.1393, 38.7139])).toBeLessThan(760);
	expect(distanceM(here, here)).toBe(0);
});

test('distances read like people say them', () => {
	expect(formatDistance(42, 'pt')).toBe('40 m');
	expect(formatDistance(126, 'pt')).toBe('130 m');
	expect(formatDistance(1234, 'pt')).toBe('1,2 km');
	expect(formatDistance(1234, 'en')).toBe('1.2 km');
	expect(formatDistance(12_600, 'en')).toBe('13 km');
	expect(formatDistance(4, 'pt')).toBe('10 m');
});

test('nearest: trees in view that pass the filters, closest first, capped', () => {
	const trees = [
		f('far', 'olive', 'in_season', -9.11, 38.74),
		f('near', 'olive', 'in_season', -9.1401, 38.7201),
		f('mid', 'pomegranate', 'in_season', -9.13, 38.725),
		f('out', 'fig', 'out', -9.1402, 38.7202),
		f('outside', 'olive', 'in_season', -8.6, 41.1)
	];
	const r = nearest(trees, bounds, { species: [], onlyPickable: true }, here, 2);
	expect(r.items.map((x) => x.tree.properties.id)).toEqual(['near', 'mid']);
	expect(r.items[0].metres).toBeLessThan(30);
	expect(r.total).toBe(3);
	const figs = nearest(trees, bounds, { species: ['fig'], onlyPickable: false }, here, 10);
	expect(figs.items.map((x) => x.tree.properties.id)).toEqual(['out']);
});
