import { alternatePath } from '$lib/fruit-stats.ts';
import type { Lang } from '$lib/i18n/index.svelte.ts';

export const prerender = true;
export const trailingSlash = 'never';

export function load({ url }) {
	const lang: Lang = url.pathname === '/en' || url.pathname.startsWith('/en/') ? 'en' : 'pt';
	return { lang, alternate: alternatePath(url.pathname) };
}
