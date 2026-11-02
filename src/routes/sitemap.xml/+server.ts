import { EDIBLE, absoluteUrl, calendarPath, fruitPath, homePath } from '$lib/site.ts';

export const prerender = true;

/** Every page with its other-language twin, as Google recommends for hreflang. */
export function GET() {
	const pairs: [string, string][] = [
		[homePath('pt'), homePath('en')],
		[calendarPath('pt'), calendarPath('en')],
		...EDIBLE.map((s): [string, string] => [fruitPath(s, 'pt'), fruitPath(s, 'en')])
	];
	const url = (loc: string, pt: string, en: string) =>
		`<url><loc>${absoluteUrl(loc)}</loc>` +
		`<xhtml:link rel="alternate" hreflang="pt-PT" href="${absoluteUrl(pt)}"/>` +
		`<xhtml:link rel="alternate" hreflang="en" href="${absoluteUrl(en)}"/>` +
		`<xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(pt)}"/></url>`;
	const body =
		'<?xml version="1.0" encoding="UTF-8"?>' +
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' +
		pairs.flatMap(([pt, en]) => [url(pt, pt, en), url(en, pt, en)]).join('') +
		'</urlset>';
	return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
