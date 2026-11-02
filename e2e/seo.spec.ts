import { expect, test, type APIRequestContext } from '@playwright/test';

const SITE = 'https://fruta-da-rua.lixo.dev';
const PAGES: [string, string, string][] = [
	// path, lang, its other-language twin
	['/', 'pt-PT', '/en'],
	['/en', 'en', '/'],
	['/fruta', 'pt-PT', '/en/fruit'],
	['/fruta/nespera', 'pt-PT', '/en/fruit/loquat'],
	['/en/fruit/bitter-orange', 'en', '/fruta/laranja-amarga']
];

async function html(request: APIRequestContext, path: string) {
	const res = await request.get(path);
	expect(res.ok(), path).toBe(true);
	return res.text();
}
const attr = (h: string, re: RegExp) => h.match(re)?.[1];

for (const [path, lang, twin] of PAGES) {
	test(`prerendered SEO for ${path}`, async ({ request }) => {
		const h = await html(request, path);
		expect(attr(h, /<html lang="([^"]+)"/)).toBe(lang);
		expect(h.match(/<title>/g)).toHaveLength(1);
		const title = attr(h, /<title>([^<]+)<\/title>/)!;
		expect(title.length, title).toBeLessThanOrEqual(70);
		expect(h.match(/<meta name="description"/g)).toHaveLength(1);
		const desc = attr(h, /<meta name="description" content="([^"]+)"/)!;
		expect(desc.length, desc).toBeGreaterThan(70);
		expect(desc.length, desc).toBeLessThanOrEqual(170);
		expect(attr(h, /<link rel="canonical" href="([^"]+)"/)).toBe(SITE + path);
		const other = lang === 'en' ? 'pt-PT' : 'en';
		expect(attr(h, new RegExp(`hreflang="${other}" href="([^"]+)"`))).toBe(SITE + twin);
		expect(h).toContain('hreflang="x-default"');
		expect(h.match(/<h1[ >]/g), 'exactly one h1').toHaveLength(1);
		const og = attr(h, /<meta property="og:image" content="([^"]+)"/)!;
		expect((await request.get(og.replace(SITE, ''))).ok(), og).toBe(true);
		for (const m of h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g))
			expect(() => JSON.parse(m[1])).not.toThrow();
		expect(h).toMatch(/application\/ld\+json/);
	});
}

test('fruit pages are real content: tree list by parish, without JavaScript', async ({ request }) => {
	const h = await html(request, '/fruta/nespera');
	expect(h).toContain('nespereiras');
	expect(h).toMatch(/<summary[^>]*>.*Arroios/s);
	expect(h).toContain('google.com/maps/dir');
});

test('sitemap lists every page in both languages, all reachable', async ({ request }) => {
	const xml = await html(request, '/sitemap.xml');
	const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
	expect(locs.length).toBe(2 * (2 + 31));
	for (const loc of locs) expect((await request.get(loc.replace(SITE, ''))).status(), loc).toBe(200);
	const robots = await html(request, '/robots.txt');
	expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
});
