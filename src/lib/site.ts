import { SPECIES } from './species.ts';
import type { Species } from './types.ts';
import type { Lang } from './i18n/index.svelte.ts';

/** Public name and address. Change here when the final name and domain are chosen. */
export const SITE_NAME = 'Fruta da Rua';
export const REPO_URL = 'https://github.com/hmiguel/fruta-da-rua';
export const SPONSOR_URL = 'https://github.com/sponsors/hmiguel';
export const SITE_URL = (import.meta.env?.PUBLIC_SITE_URL as string | undefined) ?? 'https://fruta-da-rua.lixo.dev';

export const EDIBLE: Species[] = SPECIES.filter((s) => s.tier !== 'excluded');

export function slugify(s: string): string {
	return s
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

export function fruitSlug(s: Species, lang: Lang): string {
	return slugify(lang === 'en' ? s.name_en : s.name_pt);
}

export function fruitPath(s: Species, lang: Lang): string {
	return lang === 'en' ? `/en/fruit/${fruitSlug(s, 'en')}` : `/fruta/${fruitSlug(s, 'pt')}`;
}

export function speciesBySlug(slug: string, lang: Lang): Species | undefined {
	return EDIBLE.find((s) => fruitSlug(s, lang) === slug);
}

export const homePath = (lang: Lang) => (lang === 'en' ? '/en' : '/');
export const calendarPath = (lang: Lang) => (lang === 'en' ? '/en/fruit' : '/fruta');

export function absoluteUrl(path: string): string {
	return SITE_URL.replace(/\/$/, '') + path;
}
