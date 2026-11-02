import { afterEach, expect, test } from 'vitest';
import en from './en.json';
import pt from './pt.json';
import { i18n, monthShort, setLang, t } from './index.svelte.ts';

afterEach(() => setLang('pt'));

test('pt and en have identical keys', () => {
	expect(Object.keys(en).sort()).toEqual(Object.keys(pt).sort());
});

test('defaults to pt and switches to en', () => {
	expect(i18n.lang).toBe('pt');
	const ptRipe = t('status.ripe');
	setLang('en');
	expect(t('status.ripe')).not.toBe(ptRipe);
});

test('missing key returns the key', () => {
	expect(t('nope')).toBe('nope');
});

test('interpolates variables', () => {
	expect(t('panel.soon', { n: 3 })).toContain('3');
});

test('month names follow language', () => {
	setLang('en');
	expect(monthShort(1).toLowerCase()).toContain('jan');
	setLang('pt');
	expect(monthShort(2).toLowerCase()).toContain('fev');
});

test('setLang survives localStorage throwing', () => {
	const desc = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
	Object.defineProperty(globalThis, 'localStorage', {
		configurable: true,
		get() {
			throw new Error('blocked');
		}
	});
	try {
		expect(() => setLang('en')).not.toThrow();
		expect(i18n.lang).toBe('en');
	} finally {
		if (desc) Object.defineProperty(globalThis, 'localStorage', desc);
		else delete (globalThis as { localStorage?: unknown }).localStorage;
	}
});

test('etiquette states the Lisbon rule: no climbing or beating trees', () => {
	expect(t('sheet.etiquette')).toMatch(/não suba.*vareje/i);
	setLang('en');
	expect(t('sheet.etiquette')).toMatch(/climb.*beat/i);
});

test('tree counts are singular for one', async () => {
	const { tn } = await import('./index.svelte.ts');
	expect(tn('panel.trees', 1)).toBe('1 árvore');
	expect(tn('panel.trees', 3)).toBe('3 árvores');
	setLang('en');
	expect(tn('panel.trees', 1)).toBe('1 tree');
});

test('no dashes in user-facing text (informal writing does not use them)', async () => {
	const { SPECIES } = await import('../species.ts');
	const texts = [
		...Object.values(pt),
		...Object.values(en),
		...SPECIES.flatMap((s) => [s.note_pt, s.note_en, s.name_pt, s.name_en])
	];
	for (const s of texts) expect(s, s).not.toMatch(/[—–]/);
});

test('treeName picks singular or plural in the current language', async () => {
	const { treeName } = await import('./index.svelte.ts');
	const { speciesById } = await import('../species.ts');
	const loquat = speciesById('loquat')!;
	expect(treeName(loquat, 1)).toBe('nespereira');
	expect(treeName(loquat, 250)).toBe('nespereiras');
	setLang('en');
	expect(treeName(loquat, 2)).toBe('loquat trees');
});
