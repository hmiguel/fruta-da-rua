import { expect, test } from 'vitest';
import { SPECIES } from '../src/lib/species.ts';
import { fetchAllCity, summarize, toTreeFeature, type ArcFeature } from './import-lib.ts';

const f = (sp: unknown, coords: [number, number] | null, extra = {}) =>
	({
		type: 'Feature',
		geometry: coords && { type: 'Point', coordinates: coords },
		properties: { COD_SIG_NEW: 'A1', ESPECIE_VA: sp, MORADA: 'Rua X', FREG_2012: 'Arroios', GlobalID: 'g', ...extra }
	}) as ArcFeature;

test('keeps edible in Lisbon', () => {
	const t = toTreeFeature(f('Ficus carica', [-9.1401234567, 38.7223456789]), SPECIES)!;
	expect(t.properties).toEqual({ id: 'A1', species: 'fig', address: 'Rua X', parish: 'Arroios', source: 'city' });
	expect(t.geometry.coordinates).toEqual([-9.140123, 38.722346]);
});

test('drops excluded, unknown, null species, bad geometry, outside bbox', () => {
	expect(toTreeFeature(f('Celtis australis', [-9.14, 38.72]), SPECIES)).toBeNull();
	expect(toTreeFeature(f('Platanus x hispanica', [-9.14, 38.72]), SPECIES)).toBeNull();
	expect(toTreeFeature(f(null, [-9.14, 38.72]), SPECIES)).toBeNull();
	expect(toTreeFeature(f('Ficus carica', null), SPECIES)).toBeNull();
	expect(toTreeFeature(f('Ficus carica', [NaN, 38.72]), SPECIES)).toBeNull();
	expect(toTreeFeature(f('Ficus carica', [-8.61, 41.15]), SPECIES)).toBeNull(); // Porto
});

test('falls back to GlobalID and nulls "NULL" strings', () => {
	const t = toTreeFeature(f('Ficus carica', [-9.14, 38.72], { COD_SIG_NEW: null, FREG_2012: 'NULL', MORADA: '' }), SPECIES)!;
	expect(t.properties.id).toBe('g');
	expect(t.properties.parish).toBeNull();
	expect(t.properties.address).toBeNull();
});

test('pages until short page', async () => {
	const pages = [Array(2000).fill(0), Array(2000).fill(0), Array(5).fill(0)];
	const calls: string[] = [];
	const fake = (async (url: string) => {
		calls.push(url);
		const p = pages[calls.length - 1];
		return new Response(
			JSON.stringify({ type: 'FeatureCollection', features: p.map(() => f('Ficus carica', [-9.14, 38.72])) })
		);
	}) as typeof fetch;
	expect((await fetchAllCity(fake)).length).toBe(4005);
	expect(calls).toHaveLength(3);
	expect(calls[2]).toContain('resultOffset=4000');
});

test('keeps paging while server says exceededTransferLimit', async () => {
	let n = 0;
	const fake = (async () => {
		n++;
		const features = n === 1 ? [f('Ficus carica', [-9.14, 38.72])] : [];
		return new Response(JSON.stringify({ features, exceededTransferLimit: n === 1 }));
	}) as typeof fetch;
	expect((await fetchAllCity(fake, 2000)).length).toBe(1);
	expect(n).toBe(2);
});

test('throws on HTTP error', async () => {
	await expect(fetchAllCity((async () => new Response('x', { status: 500 })) as typeof fetch)).rejects.toThrow();
});

test('summarize counts by species', () => {
	const a = toTreeFeature(f('Ficus carica', [-9.14, 38.72]), SPECIES)!;
	const b = toTreeFeature(f('Olea europaea', [-9.14, 38.72]), SPECIES)!;
	const s = summarize([a, a, b]);
	expect(s.count).toBe(3);
	expect(s.by_species).toEqual({ fig: 2, olive: 1 });
	expect(() => new Date(s.generated_at).toISOString()).not.toThrow();
});
