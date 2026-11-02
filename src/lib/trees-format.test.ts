import { expect, test } from 'vitest';
import { packTrees, unpackTrees } from './trees-format.ts';

const fc = {
	type: 'FeatureCollection' as const,
	features: [
		{
			type: 'Feature' as const,
			geometry: { type: 'Point' as const, coordinates: [-9.1401234, 38.7223456] },
			properties: { id: 'A1', species: 'fig', address: 'Rua X', parish: 'Arroios', source: 'city' as const }
		},
		{
			type: 'Feature' as const,
			geometry: { type: 'Point' as const, coordinates: [-9.2, 38.71] },
			properties: { id: 'A2', species: 'olive', address: null, parish: null, source: 'city' as const }
		},
		{
			type: 'Feature' as const,
			geometry: { type: 'Point' as const, coordinates: [-9.15, 38.73] },
			properties: { id: 'A3', species: 'fig', address: 'Rua Y', parish: 'Arroios', source: 'city' as const }
		}
	]
};

test('pack/unpack round-trips trees with ~1 m precision', () => {
	const back = unpackTrees(JSON.parse(JSON.stringify(packTrees(fc))));
	expect(back.features.map((f) => f.properties)).toEqual(fc.features.map((f) => f.properties));
	expect(back.features[0].geometry.coordinates).toEqual([-9.14012, 38.72235]);
});

test('packing shares species and parish names', () => {
	const p = packTrees(fc);
	expect(p.species).toEqual(['fig', 'olive']);
	expect(p.parishes).toEqual(['Arroios']);
	expect(JSON.stringify(p).length).toBeLessThan(JSON.stringify(fc).length / 2);
});
