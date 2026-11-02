import data from '../../data/species.json' with { type: 'json' };
import type { Species } from './types.ts';

export const SPECIES = data as Species[];

export function normalizeName(s: string): string {
	return s.toLowerCase().replace(/['"]/g, '').replace(/\s+/g, ' ').trim();
}

/** True when `name` starts with `prefix` as whole words (so `olea` doesn't match `olearia`). */
function startsWithWords(name: string, prefix: string): boolean {
	return name.startsWith(prefix) && !/[a-z]/.test(name.charAt(prefix.length));
}

/** Picks the entry whose `match` prefix is the longest one the name starts with. */
export function matchSpecies(scientific: string | null | undefined, list: Species[]): Species | null {
	if (!scientific) return null;
	const name = normalizeName(scientific);
	let best: Species | null = null;
	let bestLen = 0;
	for (const s of list) {
		for (const prefix of s.match) {
			if (prefix.length > bestLen && startsWithWords(name, prefix)) {
				best = s;
				bestLen = prefix.length;
			}
		}
	}
	return best;
}

const byId = new Map(SPECIES.map((s) => [s.id, s]));

export function speciesById(id: string): Species | undefined {
	return byId.get(id);
}
