import { expect, test } from 'vitest';
import { SPECIES } from '../species.ts';
import { SHAPES, fruitSvg } from './fruit-art.ts';

const edible = SPECIES.filter((s) => s.tier !== 'excluded');

test('every edible species has an illustration shape', () => {
	for (const s of edible) expect(SHAPES[s.id], s.id).toBeDefined();
});

test('illustrations are complete SVGs painted in the fruit colour', () => {
	for (const s of edible) {
		const svg = fruitSvg(s);
		expect(svg.startsWith('<svg'), s.id).toBe(true);
		expect(svg, s.id).toContain(s.color);
		expect(svg, s.id).not.toMatch(/undefined|NaN/);
	}
});

test('size is configurable for map icons', () => {
	expect(fruitSvg(edible[0], 96)).toContain('width="96"');
});
