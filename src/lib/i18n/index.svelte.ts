import type { Species } from '../types.ts';
import en from './en.json';
import pt from './pt.json';

export type Lang = 'pt' | 'en';

const dicts: Record<Lang, Record<string, string>> = { pt, en };
/** The language comes from the URL (`/en/...` is English); the root layout sets it. */
export const i18n = $state({ lang: 'pt' as Lang });

export const htmlLang = (l: Lang) => (l === 'en' ? 'en' : 'pt-PT');

export function setLang(l: Lang): void {
	i18n.lang = l;
	if (typeof document !== 'undefined') document.documentElement.lang = htmlLang(l);
}

export function t(key: string, vars?: Record<string, string | number>): string {
	const s = dicts[i18n.lang][key] ?? key;
	return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;
}

/** Like `t` with a count: uses `<key>_one` when n is 1. */
export function tn(key: string, n: number): string {
	return t(n === 1 && `${key}_one` in dicts[i18n.lang] ? `${key}_one` : key, { n });
}

export function speciesName(s: Species): string {
	return i18n.lang === 'en' ? s.name_en : s.name_pt;
}

export function treeName(s: Species, n: number): string {
	return (i18n.lang === 'en' ? s.tree_en : s.tree_pt)[n === 1 ? 0 : 1];
}

export function speciesNote(s: Species): string {
	return i18n.lang === 'en' ? s.note_en : s.note_pt;
}

export function monthShort(m: number): string {
	return new Date(Date.UTC(2026, m - 1, 15)).toLocaleString(i18n.lang === 'en' ? 'en-GB' : 'pt-PT', {
		month: 'short',
		timeZone: 'UTC'
	});
}
