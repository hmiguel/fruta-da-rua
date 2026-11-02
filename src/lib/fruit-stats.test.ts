import type { FeatureCollection, Point } from 'geojson';
import { expect, test } from 'vitest';
import { alternatePath, fruitStats, monthsSentence } from './fruit-stats.ts';
import { speciesById } from './species.ts';
import type { TreeProps } from './types.ts';

const t = (id: string, species: string, parish: string | null, address: string | null) => ({
	type: 'Feature' as const,
	geometry: { type: 'Point' as const, coordinates: [-9.14, 38.72] },
	properties: { id, species, parish, address, source: 'city' as const }
});
const fc: FeatureCollection<Point, TreeProps> = {
	type: 'FeatureCollection',
	features: [
		t('1', 'loquat', 'Arroios', 'Rua B'),
		t('2', 'loquat', 'Arroios', 'Rua A'),
		t('3', 'loquat', 'Belém', null),
		t('4', 'fig', 'Arroios', 'Rua C'),
		t('5', 'loquat', null, 'Rua D')
	]
};

test('fruitStats groups a species by parish, biggest first, addresses sorted', () => {
	const s = fruitStats(fc, 'loquat');
	expect(s.count).toBe(4);
	expect(s.parishes.map((p) => [p.name, p.trees.length])).toEqual([
		['Arroios', 2],
		['Belém', 1],
		[null, 1]
	]);
	expect(s.parishes[0].trees.map((t) => t.address)).toEqual(['Rua A', 'Rua B']);
	expect(s.parishes[0].trees[0]).toMatchObject({ lat: 38.72, lng: -9.14 });
});

test('monthsSentence reads naturally, including across the new year', () => {
	expect(monthsSentence(speciesById('loquat')!.ripe, 'pt')).toBe('de abril a junho');
	expect(monthsSentence(speciesById('olive')!.ripe, 'pt')).toBe('de outubro a janeiro');
	expect(monthsSentence(speciesById('olive')!.ripe, 'en')).toBe('from October to January');
	expect(monthsSentence(speciesById('lemon')!.ripe, 'pt')).toBe('todo o ano');
	expect(monthsSentence([5], 'en')).toBe('in May');
});

test('alternatePath maps every page to its other-language twin', () => {
	expect(alternatePath('/')).toBe('/en');
	expect(alternatePath('/en')).toBe('/');
	expect(alternatePath('/fruta')).toBe('/en/fruit');
	expect(alternatePath('/en/fruit')).toBe('/fruta');
	expect(alternatePath('/fruta/nespera')).toBe('/en/fruit/loquat');
	expect(alternatePath('/en/fruit/bitter-orange')).toBe('/fruta/laranja-amarga');
	expect(alternatePath('/fruta/nope')).toBe('/en/fruit');
});
