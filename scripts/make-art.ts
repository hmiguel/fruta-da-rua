// Renders each fruit illustration to WebP in static/art/ (sm: lists and map, lg: fruit pages),
// so phones show a light image instead of computing watercolour filters.
// Run after changing the art: node scripts/make-art.ts
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fruitSvg } from '../src/lib/art/fruit-art.ts';
import { EDIBLE } from '../src/lib/site.ts';

const SIZES = { sm: 96, lg: 240 }; // device pixels: 48 and 120 CSS px at 2×

const browser = await chromium.launch();
const page = await browser.newPage();
let total = 0;
for (const [dir, px] of Object.entries(SIZES)) {
	mkdirSync(`static/art/${dir}`, { recursive: true });
	for (const s of EDIBLE) {
		const dataUrl = await page.evaluate(
			async ({ svg, px }) => {
				const img = new Image(px, px);
				img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
				await img.decode();
				const canvas = Object.assign(document.createElement('canvas'), { width: px, height: px });
				canvas.getContext('2d')!.drawImage(img, 0, 0, px, px);
				return canvas.toDataURL('image/webp', 0.86);
			},
			{ svg: fruitSvg(s, px), px }
		);
		const bytes = Buffer.from(dataUrl.split(',')[1], 'base64');
		total += bytes.length;
		writeFileSync(`static/art/${dir}/${s.id}.webp`, bytes);
	}
}
await browser.close();
console.log(`Wrote ${EDIBLE.length * 2} illustrations to static/art/ (${Math.round(total / 1024)} KB)`);
