import { loadFruit } from '$lib/load-fruit.ts';
import { EDIBLE, fruitSlug } from '$lib/site.ts';

export const entries = () => EDIBLE.map((s) => ({ slug: fruitSlug(s, 'pt') }));

export const load = ({ params, fetch }) => loadFruit(params.slug, 'pt', fetch);
