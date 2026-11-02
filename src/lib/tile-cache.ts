/**
 * Which service-worker cache a map request belongs in. Vector tiles are many and get trimmed;
 * the style, tile manifest, sprites and glyphs are few and must never be evicted, or the map
 * can't start offline.
 */
export function mapCacheFor(url: string): 'tiles' | 'map-assets' {
	const { pathname } = new URL(url);
	return pathname.endsWith('.pbf') && !pathname.startsWith('/fonts/') ? 'tiles' : 'map-assets';
}
