import { expect, test } from 'vitest';
import {
	DEFAULT_FILTERS,
	chipList,
	filtersFromQuery,
	filtersToQuery,
	matchesFilter,
	readSaved,
	searchFruits,
	summarize,
	toggleSpecies,
	withFilters,
	writeSaved
} from './filters.ts';
import type { EnrichedProps } from './map/enrich.ts';
import type { Status } from './types.ts';

const f = (species: string, status: Status, lon = -9.14, lat = 38.72) => ({
	type: 'Feature' as const,
	geometry: { type: 'Point' as const, coordinates: [lon, lat] },
	properties: {
		id: species + lon + status,
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
const NOV = new Date('2026-11-15T12:00:00Z');

test('no fruit chosen shows every fruit; the season switch hides what is out of season', () => {
	const fig = { species: 'fig', pickable: false };
	expect(matchesFilter(fig, { species: [], onlyPickable: true })).toBe(false);
	expect(matchesFilter(fig, { species: [], onlyPickable: false })).toBe(true);
});

test('chosen fruits combine with the season switch (both must hold)', () => {
	const olive = { species: 'olive', pickable: true };
	const fig = { species: 'fig', pickable: false };
	expect(matchesFilter(olive, { species: ['olive', 'fig'], onlyPickable: true })).toBe(true);
	expect(matchesFilter(fig, { species: ['olive', 'fig'], onlyPickable: true })).toBe(false);
	expect(matchesFilter(fig, { species: ['olive', 'fig'], onlyPickable: false })).toBe(true);
	expect(matchesFilter(olive, { species: ['fig'], onlyPickable: false })).toBe(false);
});

test('toggleSpecies adds and removes without touching the other choices', () => {
	expect(toggleSpecies([], 'fig')).toEqual(['fig']);
	expect(toggleSpecies(['fig', 'olive'], 'fig')).toEqual(['olive']);
	expect(toggleSpecies(['olive'], 'fig')).toEqual(['olive', 'fig']);
});

test('summarize counts visible trees in view, and per fruit ignoring the fruit choice', () => {
	const features = [
		f('olive', 'in_season'),
		f('olive', 'in_season'),
		f('pomegranate', 'in_season'),
		f('fig', 'out'),
		f('olive', 'in_season', -8.6, 41.1)
	];
	const s = summarize(features, bounds, { species: ['pomegranate'], onlyPickable: true });
	expect(s.visible).toBe(1);
	expect(s.bySpecies).toEqual([
		{ species: 'olive', count: 2 },
		{ species: 'pomegranate', count: 1 }
	]);
	const all = summarize([...features, f('fig', 'out', -9.15)], bounds, { species: [], onlyPickable: false });
	expect(all.visible).toBe(5);
	// Fruit in season comes before more numerous fruit that isn't.
	expect(all.bySpecies.map((c) => c.species)).toEqual(['olive', 'pomegranate', 'fig']);
});

test('chipList puts chosen fruits first, even with no trees in view, and caps the rest', () => {
	const counts = [
		{ species: 'olive', count: 9 },
		{ species: 'pomegranate', count: 5 },
		{ species: 'persimmon', count: 2 }
	];
	expect(chipList(counts, ['fig', 'persimmon'], 3)).toEqual([
		{ species: 'fig', count: 0 },
		{ species: 'persimmon', count: 2 },
		{ species: 'olive', count: 9 }
	]);
	expect(chipList(counts, [], 8)).toEqual(counts);
});

test('the URL carries chosen fruits by their name in the page language, and the season switch', () => {
	expect(filtersToQuery(DEFAULT_FILTERS, 'pt')).toBe('');
	expect(filtersToQuery({ species: ['fig', 'loquat'], onlyPickable: false }, 'pt')).toBe('?fruta=figo,nespera&epoca=0');
	expect(filtersToQuery({ species: ['fig'], onlyPickable: true }, 'en')).toBe('?fruta=fig');
	expect(filtersFromQuery('?fruta=figo,nespera&epoca=0', 'pt')).toEqual({
		species: ['fig', 'loquat'],
		onlyPickable: false
	});
	expect(filtersFromQuery('?fruta=fig', 'en')).toEqual({ species: ['fig'], onlyPickable: true });
	expect(filtersFromQuery('?fruta=nope', 'pt')).toEqual({ species: [], onlyPickable: true });
	expect(filtersFromQuery('', 'pt')).toBeNull();
	expect(filtersFromQuery('?e2e=1', 'pt')).toBeNull();
});

test('saved filters survive a reload, drop unknown fruits, and never throw', () => {
	const store = new Map<string, string>();
	const ls = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
	writeSaved({ species: ['fig', 'gone'], onlyPickable: false }, ls);
	expect(readSaved(ls)).toEqual({ species: ['fig'], onlyPickable: false });
	store.set('fruta-filtros', '{broken');
	expect(readSaved(ls)).toBeNull();
	const blocked = {
		getItem: () => {
			throw new Error('blocked');
		},
		setItem: () => {
			throw new Error('blocked');
		}
	};
	expect(readSaved(blocked)).toBeNull();
	expect(() => writeSaved(DEFAULT_FILTERS, blocked)).not.toThrow();
});

test('fruit search ignores accents and case, and knows both languages and the Latin name', () => {
	const ids = (q: string) => searchFruits(q, NOV).map((s) => s.id);
	expect(ids('diospiro')[0]).toBe('persimmon');
	expect(ids('NÊSP')).toContain('loquat');
	expect(ids('persimmon')[0]).toBe('persimmon');
	expect(ids('ficus')).toContain('fig');
	expect(ids('xyz')).toEqual([]);
});

test('an empty search lists every fruit, in season first', () => {
	const all = searchFruits('', NOV);
	expect(all.length).toBeGreaterThan(25);
	expect(all.some((s) => s.id === 'stone_pine' || s.tier === 'excluded')).toBe(false);
	const firstOut = all.findIndex((s) => !s.ripe.includes(11));
	expect(all.slice(firstOut).every((s) => !s.ripe.includes(11))).toBe(true);
});

test('withFilters rewrites only the filter part of the address', () => {
	const f = { species: ['fig'], onlyPickable: false };
	expect(withFilters('?e2e=1&fruta=romã', f, 'pt')).toBe('?e2e=1&fruta=figo&epoca=0');
	expect(withFilters('?fruta=figo&epoca=0', DEFAULT_FILTERS, 'pt')).toBe('');
	expect(withFilters('', DEFAULT_FILTERS, 'pt')).toBe('');
});
