import { loadFruit } from '$lib/load-fruit.ts';
import { EDIBLE, fruitSlug } from '$lib/site.ts';

export const entries = () => EDIBLE.map((s) => ({ slug: fruitSlug(s, 'en') }));

export const load = ({ params, fetch }) => loadFruit(params.slug, 'en', fetch);
