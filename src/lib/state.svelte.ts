import { DEFAULT_FILTERS, toggleSpecies, type Filters } from './filters.ts';

export const app = $state({
	filters: { ...DEFAULT_FILTERS } as Filters,
	selectedTreeId: null as string | null,
	menuOpen: false,
	searchOpen: false
});

/** The dialog on top takes Escape first. */
export const topLayer = () => (app.menuOpen ? 'menu' : app.searchOpen ? 'search' : null);

/**
 * Adds or removes a fruit. Choosing one that isn't in season turns the season switch off,
 * otherwise the map would show nothing for the fruit just picked.
 */
export function chooseFruit(id: string, pickableNow: boolean): void {
	const adding = !app.filters.species.includes(id);
	app.filters = {
		species: toggleSpecies(app.filters.species, id),
		onlyPickable: app.filters.onlyPickable && (!adding || pickableNow)
	};
	app.selectedTreeId = null;
}
