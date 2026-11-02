import { expect, test } from 'vitest';
import { SPECIES } from './species.ts';
import { EDIBLE, absoluteUrl, fruitPath, slugify, speciesBySlug } from './site.ts';

test('slugify strips accents and spaces', () => {
	expect(slugify('Nêspera')).toBe('nespera');
	expect(slugify('Laranja-amarga')).toBe('laranja-amarga');
	expect(slugify('Strawberry tree')).toBe('strawberry-tree');
});

test('every edible fruit has unique pt and en paths', () => {
	expect(EDIBLE.length).toBe(SPECIES.filter((s) => s.tier !== 'excluded').length);
	for (const lang of ['pt', 'en'] as const) {
		const paths = EDIBLE.map((s) => fruitPath(s, lang));
		expect(new Set(paths).size).toBe(paths.length);
	}
	const loquat = EDIBLE.find((s) => s.id === 'loquat')!;
	expect(fruitPath(loquat, 'pt')).toBe('/fruta/nespera');
	expect(fruitPath(loquat, 'en')).toBe('/en/fruit/loquat');
});

test('slug lookup round-trips', () => {
	for (const s of EDIBLE) {
		expect(speciesBySlug(fruitPath(s, 'pt').split('/').pop()!, 'pt')?.id).toBe(s.id);
		expect(speciesBySlug(fruitPath(s, 'en').split('/').pop()!, 'en')?.id).toBe(s.id);
	}
	expect(speciesBySlug('celtis', 'pt')).toBeUndefined();
});

test('absolute URLs use the site origin', () => {
	expect(absoluteUrl('/fruta')).toMatch(/^https:\/\/[^/]+\/fruta$/);
});
