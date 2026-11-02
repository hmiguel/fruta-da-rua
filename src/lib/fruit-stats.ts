import type { FeatureCollection, Point } from 'geojson';
import type { Lang } from './i18n/index.svelte.ts';
import { calendarPath, fruitPath, homePath, speciesBySlug } from './site.ts';
import type { TreeProps } from './types.ts';

export interface ParishTree {
	id: string;
	address: string | null;
	lat: number;
	lng: number;
}

export interface FruitStats {
	count: number;
	parishes: { name: string | null; trees: ParishTree[] }[];
}

export function fruitStats(fc: FeatureCollection<Point, TreeProps>, speciesId: string): FruitStats {
	const byParish = new Map<string | null, ParishTree[]>();
	let count = 0;
	for (const f of fc.features) {
		if (f.properties.species !== speciesId) continue;
		count++;
		const [lng, lat] = f.geometry.coordinates;
		const list = byParish.get(f.properties.parish) ?? [];
		list.push({ id: f.properties.id, address: f.properties.address, lat, lng });
		byParish.set(f.properties.parish, list);
	}
	const parishes = [...byParish]
		.map(([name, trees]) => ({
			name,
			trees: trees.sort((a, b) => (a.address ?? '￿').localeCompare(b.address ?? '￿', 'pt'))
		}))
		.sort((a, b) => (a.name === null ? 1 : b.name === null ? -1 : b.trees.length - a.trees.length));
	return { count, parishes };
}

function monthName(m: number, lang: Lang): string {
	return new Date(Date.UTC(2026, m - 1, 15)).toLocaleString(lang === 'en' ? 'en-GB' : 'pt-PT', {
		month: 'long',
		timeZone: 'UTC'
	});
}

/** "de outubro a janeiro" / "from October to January". `months` is in harvest order. */
export function monthsSentence(months: number[], lang: Lang): string {
	if (months.length >= 12) return lang === 'en' ? 'all year round' : 'todo o ano';
	const first = monthName(months[0], lang);
	if (months.length === 1) return lang === 'en' ? `in ${first}` : `em ${first}`;
	const last = monthName(months[months.length - 1], lang);
	return lang === 'en' ? `from ${first} to ${last}` : `de ${first} a ${last}`;
}

/** The same page in the other language. */
export function alternatePath(pathname: string): string {
	const path = pathname.replace(/\/$/, '') || '/';
	const lang: Lang = path === '/en' || path.startsWith('/en/') ? 'en' : 'pt';
	const other: Lang = lang === 'en' ? 'pt' : 'en';
	const fruit = path.match(/^\/(?:fruta|en\/fruit)\/([^/]+)$/);
	if (fruit) {
		const sp = speciesBySlug(fruit[1], lang);
		return sp ? fruitPath(sp, other) : calendarPath(other);
	}
	if (path === calendarPath(lang)) return calendarPath(other);
	return homePath(other);
}
