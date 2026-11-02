import { expect, test } from 'vitest';
import { PAPER, naturePaint } from './nature-style.ts';

test('paper, watercolour water and parks', () => {
	expect(naturePaint('background', 'background')).toEqual([['background-color', PAPER]]);
	expect(naturePaint('water', 'fill')).toEqual([['fill-color', '#c5dbd6']]);
	expect(naturePaint('waterway_river', 'line')).toEqual([['line-color', '#c5dbd6']]);
	expect(naturePaint('park', 'fill')).toEqual([['fill-color', '#d3e3c1']]);
	expect(naturePaint('landuse_hospital', 'fill')).toEqual([['fill-color', '#e5e7d8']]);
	expect(naturePaint('building', 'fill')).toEqual([['fill-color', '#dfe0d0']]);
});

test('roads drawn as pencil-cased paper lines; rails and boundaries untouched', () => {
	expect(naturePaint('road_trunk_primary', 'line')).toEqual([['line-color', '#fbfbf5']]);
	expect(naturePaint('bridge_motorway_link', 'line')).toEqual([['line-color', '#fbfbf5']]);
	expect(naturePaint('tunnel_secondary_tertiary_casing', 'line')).toEqual([['line-color', '#c9c6b4']]);
	expect(naturePaint('road_major_rail', 'line')).toBeNull();
	expect(naturePaint('boundary_2', 'line')).toBeNull();
});

test('labels in ink on a paper halo', () => {
	expect(naturePaint('label_city', 'symbol')).toEqual([
		['text-color', '#4a4334'],
		['text-halo-color', PAPER]
	]);
});

test('points of interest and one-way arrows are hidden; 3D buildings drawn in paper tones', async () => {
	const { keepLayer } = await import('./nature-style.ts');
	expect(keepLayer('poi_transit')).toBe(false);
	expect(keepLayer('poi_r1')).toBe(false);
	expect(keepLayer('road_one_way_arrow')).toBe(false);
	expect(keepLayer('label_city')).toBe(true);
	expect(keepLayer('water')).toBe(true);
	expect(naturePaint('building-3d', 'fill-extrusion')).toEqual([['fill-extrusion-color', '#dcdccb']]);
});
