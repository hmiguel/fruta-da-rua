import { absoluteUrl } from '$lib/site.ts';

export const prerender = true;

export function GET() {
	return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('/sitemap.xml')}\n`, {
		headers: { 'Content-Type': 'text/plain' }
	});
}
