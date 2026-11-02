import { error } from '@sveltejs/kit';
import { fruitStats } from './fruit-stats.ts';
import type { Lang } from './i18n/index.svelte.ts';
import { speciesBySlug } from './site.ts';
import { unpackTrees, type PackedTrees } from './trees-format.ts';

export async function loadFruit(slug: string, lang: Lang, fetchFn: typeof fetch) {
	const sp = speciesBySlug(slug, lang);
	if (!sp) error(404, 'Not found');
	const fc = unpackTrees((await (await fetchFn('/trees.json')).json()) as PackedTrees);
	return { speciesId: sp.id, stats: fruitStats(fc, sp.id) };
}
