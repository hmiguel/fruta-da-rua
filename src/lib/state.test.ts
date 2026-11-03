import { beforeEach, expect, test } from 'vitest';
import { DEFAULT_FILTERS } from './filters.ts';
import { app, chooseFruit } from './state.svelte.ts';

beforeEach(() => (app.filters = { ...DEFAULT_FILTERS }));

test('choosing a fruit in season keeps the season switch on', () => {
	chooseFruit('olive', true);
	expect(app.filters).toEqual({ species: ['olive'], onlyPickable: true });
});

test('choosing a fruit out of season turns the switch off so its trees show', () => {
	chooseFruit('fig', false);
	expect(app.filters).toEqual({ species: ['fig'], onlyPickable: false });
});

test('removing a fruit never changes the switch', () => {
	app.filters = { species: ['fig', 'olive'], onlyPickable: true };
	chooseFruit('fig', false);
	expect(app.filters).toEqual({ species: ['olive'], onlyPickable: true });
});
