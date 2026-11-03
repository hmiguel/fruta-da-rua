import type { Feature, Point } from 'geojson';
import { inBBox, type BBox } from './geo.ts';
import { speciesName, type Lang } from './i18n/index.svelte.ts';
import type { EnrichedProps } from './map/enrich.ts';
import { seasonStatus } from './season.ts';
import { EDIBLE, fruitSlug, slugify, speciesBySlug } from './site.ts';
import { speciesById } from './species.ts';
import type { Species, Status } from './types.ts';

/** What the map shows: chosen fruits (none means all) and whether to hide fruit out of season. */
export interface Filters {
	species: string[];
	onlyPickable: boolean;
}

export interface SpeciesCount {
	species: string;
	count: number;
}

export const DEFAULT_FILTERS: Filters = { species: [], onlyPickable: true };

export function matchesFilter(props: { species: string; pickable: boolean }, f: Filters): boolean {
	if (f.species.length && !f.species.includes(props.species)) return false;
	return props.pickable || !f.onlyPickable;
}

export function toggleSpecies(chosen: string[], id: string): string[] {
	return chosen.includes(id) ? chosen.filter((s) => s !== id) : [...chosen, id];
}

/**
 * `visible`: trees in view that pass every filter. `bySpecies`: trees in view per fruit under the
 * season switch only, in season first, so the chips can offer fruits that aren't chosen yet.
 */
export function summarize(features: Feature<Point, EnrichedProps>[], bounds: BBox, f: Filters) {
	let visible = 0;
	const per = new Map<string, number>();
	const ripe = new Set<string>();
	const seasonOnly = { ...f, species: [] };
	for (const feat of features) {
		if (!inBBox(feat.geometry.coordinates, bounds)) continue;
		if (!matchesFilter(feat.properties, seasonOnly)) continue;
		per.set(feat.properties.species, (per.get(feat.properties.species) ?? 0) + 1);
		if (feat.properties.pickable) ripe.add(feat.properties.species);
		if (matchesFilter(feat.properties, f)) visible++;
	}
	const bySpecies = [...per]
		.map(([species, count]) => ({ species, count }))
		.sort((a, b) => Number(ripe.has(b.species)) - Number(ripe.has(a.species)) || b.count - a.count);
	return { visible, bySpecies };
}

/** Chosen fruits first (so they can be unchosen), then the most common in view, `max` in all. */
export function chipList(counts: SpeciesCount[], chosen: string[], max: number): SpeciesCount[] {
	const first = chosen.map((species) => counts.find((c) => c.species === species) ?? { species, count: 0 });
	const rest = counts.filter((c) => !chosen.includes(c.species));
	return [...first, ...rest].slice(0, Math.max(max, first.length));
}

/** `?fruta=figo,nespera&epoca=0`, with each fruit named in the page language. */
export function filtersToQuery(f: Filters, lang: Lang): string {
	const p: string[] = [];
	const slugs = f.species
		.map((id) => speciesById(id))
		.filter((s) => s !== undefined)
		.map((s) => fruitSlug(s, lang));
	if (slugs.length) p.push(`fruta=${slugs.join(',')}`);
	if (!f.onlyPickable) p.push('epoca=0');
	return p.length ? `?${p.join('&')}` : '';
}

/** Replaces the filter part of `search`, keeping any other parameters. */
export function withFilters(search: string, f: Filters, lang: Lang): string {
	const others = search
		.replace(/^\?/, '')
		.split('&')
		.filter((p) => p && !/^(fruta|epoca)=/.test(p));
	const ours = filtersToQuery(f, lang).replace(/^\?/, '');
	const all = [...others, ...(ours ? [ours] : [])];
	return all.length ? `?${all.join('&')}` : '';
}

/** Null when the URL says nothing about filters, so saved ones can apply instead. */
export function filtersFromQuery(search: string, lang: Lang): Filters | null {
	const q = new URLSearchParams(search);
	if (!q.has('fruta') && !q.has('epoca')) return null;
	const species = (q.get('fruta') ?? '')
		.split(',')
		.map((slug) => speciesBySlug(slug, lang)?.id)
		.filter((id) => id !== undefined);
	return { species, onlyPickable: q.get('epoca') !== '0' };
}

const KEY = 'fruta-filtros';
type Store = Pick<Storage, 'getItem' | 'setItem'>;

export function readSaved(store: Store): Filters | null {
	try {
		const v = JSON.parse(store.getItem(KEY) ?? 'null');
		if (!v || !Array.isArray(v.species)) return null;
		return {
			species: v.species.filter((id: unknown) => typeof id === 'string' && EDIBLE.some((s) => s.id === id)),
			onlyPickable: v.onlyPickable !== false
		};
	} catch {
		return null;
	}
}

export function writeSaved(f: Filters, store: Store): void {
	try {
		store.setItem(KEY, JSON.stringify(f));
	} catch {
		// Private mode or blocked storage: the filters just won't be remembered.
	}
}

const fold = (s: string) => slugify(s).replace(/-/g, ' ');
const STATUS_ORDER: Record<Status, number> = { ripe: 0, in_season: 0, picked: 1, soon: 1, out: 2 };

/** Fruits matching `query` in either language or by Latin name; best matches, then in season, first. */
export function searchFruits(query: string, now: Date): Species[] {
	const q = fold(query);
	const scored: { sp: Species; score: number }[] = [];
	for (const sp of EDIBLE) {
		const names = [sp.name_pt, sp.name_en, ...sp.tree_pt, ...sp.tree_en, ...sp.match].map(fold);
		let score = 0;
		if (q) {
			if (names.some((n) => n.startsWith(q))) score = 0;
			else if (names.some((n) => n.includes(` ${q}`))) score = 1;
			else if (names.some((n) => n.includes(q))) score = 2;
			else continue;
		}
		scored.push({ sp, score: score * 10 + STATUS_ORDER[seasonStatus(sp, now)] });
	}
	return scored
		.sort((a, b) => a.score - b.score || speciesName(a.sp).localeCompare(speciesName(b.sp)))
		.map((x) => x.sp);
}
