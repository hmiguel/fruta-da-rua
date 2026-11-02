/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, prerendered, version } from '$service-worker';
import { mapCacheFor } from '$lib/tile-cache.ts';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `fruta-${version}`;
const TILE_LIMIT = 300;
// Precache only what the map needs offline; fruit pages and share images are cached when visited,
// so installing the app doesn't cost phone users megabytes of data.
const ASSETS = [
	...build,
	...files.filter((f) => !f.startsWith('/og/') && !f.startsWith('/art/lg/')),
	...prerendered.filter((p) => p === '/' || p === '/en')
];

sw.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => sw.skipWaiting()));
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE && !k.startsWith('fruta-map-')).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

async function trim(cache: Cache) {
	const keys = await cache.keys();
	await Promise.all(keys.slice(0, Math.max(0, keys.length - TILE_LIMIT)).map((k) => cache.delete(k)));
}

/** Map tiles, styles and fonts: serve from cache, refresh in the background. */
async function staleWhileRevalidate(request: Request): Promise<Response> {
	const kind = mapCacheFor(request.url);
	const cache = await caches.open(`fruta-map-${kind}`);
	const cached = await cache.match(request);
	const network = fetch(request)
		.then(async (res) => {
			if (res.ok) {
				await cache.put(request, res.clone());
				if (kind === 'tiles') await trim(cache);
			}
			return res;
		})
		.catch(() => cached ?? Response.error());
	return cached ?? network;
}

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);

	if (url.hostname === 'tiles.openfreemap.org') {
		event.respondWith(staleWhileRevalidate(request));
		return;
	}
	if (url.origin !== location.origin) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			if (ASSETS.includes(url.pathname)) {
				const hit = await cache.match(url.pathname);
				if (hit) return hit;
			}
			try {
				const res = await fetch(request);
				if (res.ok && request.mode === 'navigate') await cache.put(request, res.clone());
				return res;
			} catch {
				// Offline navigation: fall back to the app shell.
				return (await cache.match(url.pathname)) ?? (await cache.match('/')) ?? Response.error();
			}
		})()
	);
});
