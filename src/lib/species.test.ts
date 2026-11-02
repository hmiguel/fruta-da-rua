import { expect, test } from 'vitest';
import { SPECIES, matchSpecies, normalizeName } from './species.ts';

test('normalizes names', () => {
	expect(normalizeName('  Prunus   Avium ')).toBe('prunus avium');
	expect(normalizeName("Morus alba var. 'Fruitless'")).toBe('morus alba var. fruitless');
});

test('matches basic and messy names', () => {
	expect(matchSpecies('Ficus carica', SPECIES)?.id).toBe('fig');
	expect(matchSpecies('Prunus domestica  subsp. insititia', SPECIES)?.id).toBe('plum');
	expect(matchSpecies('Prunus amigdalus', SPECIES)?.id).toBe('almond');
	expect(matchSpecies("Punica granatum 'Nana'", SPECIES)?.id).toBe('pomegranate');
	expect(matchSpecies('Citrus x aurantium', SPECIES)?.id).toBe('bitter_orange');
	expect(matchSpecies('Prunus spinosa', SPECIES)?.id).toBe('plum');
});

test('longest prefix wins for ornamentals', () => {
	expect(matchSpecies("Morus alba var. 'Fruitless'", SPECIES)?.tier).toBe('excluded');
	expect(matchSpecies('Morus alba', SPECIES)?.id).toBe('mulberry');
	expect(matchSpecies('Prunus avium plena', SPECIES)?.tier).toBe('excluded');
	expect(matchSpecies('Prunus avium', SPECIES)?.id).toBe('cherry');
	expect(matchSpecies('Prunus sp.', SPECIES)?.tier).toBe('excluded');
});

test('excluded/toxic never edible', () => {
	for (const n of [
		'Celtis australis',
		'Nerium oleander',
		'Taxus baccata',
		'Pyrus calleryana var. Chanticleer',
		'Prunus cerasifera subsp. pissardii',
		'Phoenix canariensis',
		'Corylus colurna',
		'Persea indica'
	])
		expect(matchSpecies(n, SPECIES)?.tier ?? 'excluded').toBe('excluded');
});

test('null/unknown → null', () => {
	expect(matchSpecies(null, SPECIES)).toBeNull();
	expect(matchSpecies(undefined, SPECIES)).toBeNull();
	expect(matchSpecies('NULL', SPECIES)).toBeNull();
	expect(matchSpecies('Platanus x hispanica', SPECIES)).toBeNull();
});

test('species data is valid', () => {
	for (const s of SPECIES.filter((s) => s.tier !== 'excluded')) {
		expect(s.ripe.length).toBeGreaterThan(0);
		expect(s.ripe.every((m) => m >= 1 && m <= 12)).toBe(true);
		expect(s.peak.every((m) => s.ripe.includes(m))).toBe(true);
	}
	expect(new Set(SPECIES.map((s) => s.id)).size).toBe(SPECIES.length);
});

test('edible species colours are saturated, never mistaken for out-of-season grey', () => {
	const saturation = (hex: string) => {
		const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const l = (max + min) / 2;
		return max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
	};
	for (const s of SPECIES.filter((s) => s.tier !== 'excluded')) expect(saturation(s.color), s.id).toBeGreaterThan(0.3);
});

test('prefixes only match whole words', () => {
	expect(matchSpecies('Olearia traversii', SPECIES)).toBeNull();
	expect(matchSpecies('Malusia foo', SPECIES)).toBeNull();
	expect(matchSpecies('Olea europaea', SPECIES)?.id).toBe('olive');
	expect(matchSpecies('Citrus sp.', SPECIES)?.id).toBe('citrus');
	expect(matchSpecies('Prunus spinosa', SPECIES)?.id).toBe('plum');
});

test('pine nuts are excluded: collecting cones is illegal Apr–Nov (DL 77/2015) and needs climbing', () => {
	expect(matchSpecies('Pinus pinea', SPECIES)?.tier).toBe('excluded');
	expect(SPECIES.find((s) => s.id === 'pine_nut')).toBeUndefined();
});

test('olive note warns that beating branches is forbidden', () => {
	const olive = SPECIES.find((s) => s.id === 'olive')!;
	expect(olive.note_pt).toMatch(/varejar/);
	expect(olive.note_en).toMatch(/beat/i);
});

test('every edible species names its tree in both languages', () => {
	for (const s of SPECIES.filter((s) => s.tier !== 'excluded'))
		for (const n of [...s.tree_pt, ...s.tree_en]) expect(n.length, s.id).toBeGreaterThan(2);
});
