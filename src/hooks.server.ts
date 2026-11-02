import type { Handle } from '@sveltejs/kit';

/** Pages under /en are English; everything else is European Portuguese. */
export const handle: Handle = ({ event, resolve }) => {
	const lang = event.url.pathname === '/en' || event.url.pathname.startsWith('/en/') ? 'en' : 'pt-PT';
	return resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', lang) });
};
