import { expect, test } from 'vitest';
import { mapCacheFor } from './tile-cache.ts';

test('only vector tiles go to the trimmed cache; style, sprites and glyphs are kept', () => {
	expect(mapCacheFor('https://tiles.openfreemap.org/planet/20261029_001001_pt/14/7812/6178.pbf')).toBe('tiles');
	expect(mapCacheFor('https://tiles.openfreemap.org/styles/positron')).toBe('map-assets');
	expect(mapCacheFor('https://tiles.openfreemap.org/planet')).toBe('map-assets');
	expect(mapCacheFor('https://tiles.openfreemap.org/sprites/ofm_f384/ofm@2x.png')).toBe('map-assets');
	expect(mapCacheFor('https://tiles.openfreemap.org/fonts/Noto%20Sans%20Regular/0-255.pbf')).toBe('map-assets');
});
