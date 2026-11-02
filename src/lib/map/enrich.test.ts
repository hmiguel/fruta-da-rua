import type { FeatureCollection, Point } from 'geojson';
import { expect, test } from 'vitest';
import { speciesById } from '../species.ts';
import type { TreeProps } from '../types.ts';
import { OUT_COLOR, enrich, matchesFilter } from './enrich.ts';

const tree = (id: string, species: string) => ({
	type: 'Feature' as const,
	geometry: { type: 'Point' as const, coordinates: [-9.14, 38.72] },
	properties: { id, species, address: null, parish: null, source: 'city' as const }
});
const fc: FeatureCollection<Point, TreeProps> = {
	type: 'FeatureCollection',
	features: [tree('a', 'fig'), tree('b', 'persimmon')]
};

test('enrich marks November fig out and persimmon in season', () => {
	const [fig, persimmon] = enrich(fc, new Date('2026-11-15T12:00Z')).features.map((f) => f.properties);
	expect(fig).toMatchObject({ id: 'a', status: 'out', pickable: false, color: OUT_COLOR });
	expect(persimmon).toMatchObject({
		id: 'b',
		status: 'in_season',
		pickable: true,
		color: speciesById('persimmon')!.color
	});
});

test('enrich drops trees whose species id is unknown', () => {
	const bad = { ...fc, features: [...fc.features, tree('c', 'dragonfruit')] };
	expect(enrich(bad, new Date('2026-11-15T12:00Z')).features).toHaveLength(2);
});

test('matchesFilter', () => {
	expect(matchesFilter({ species: 'fig', pickable: false }, true, null)).toBe(false);
	expect(matchesFilter({ species: 'fig', pickable: false }, false, null)).toBe(true);
	expect(matchesFilter({ species: 'fig', pickable: false }, false, 'fig')).toBe(true);
	expect(matchesFilter({ species: 'olive', pickable: true }, true, 'fig')).toBe(false);
	expect(matchesFilter({ species: 'olive', pickable: true }, true, 'olive')).toBe(true);
});

test('a selected species shows all its trees even when none are pickable (soon rows)', () => {
	expect(matchesFilter({ species: 'orange', pickable: false }, true, 'orange')).toBe(true);
});
