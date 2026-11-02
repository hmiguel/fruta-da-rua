// Draws the app icon (a watercolour orange on notebook paper) to static/icon.svg and the PNG
// app icons. Run after changing the art: node scripts/make-icons.ts
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { fruitSvg } from '../src/lib/art/fruit-art.ts';
import { speciesById } from '../src/lib/species.ts';

const PAPER = '#eef0e4';
const fruit = fruitSvg(speciesById('orange')!, 400).replace('<svg ', '<svg x="56" y="40" ');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${PAPER}"/>${fruit}</svg>`;
writeFileSync('static/icon.svg', svg);

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, size, inset] of [
	['icon-192.png', 192, 0],
	['icon-512.png', 512, 0],
	['maskable-512.png', 512, 0.12],
	['apple-touch-icon.png', 180, 0]
] as const) {
	await page.setViewportSize({ width: size, height: size });
	const pad = Math.round(size * inset);
	await page.setContent(
		`<body style="margin:0;background:${PAPER}"><div style="padding:${pad}px;width:${size}px;height:${size}px;box-sizing:border-box">${svg.replace('<svg ', `<svg width="${size - 2 * pad}" height="${size - 2 * pad}" `)}</div></body>`
	);
	await page.screenshot({ path: `static/icons/${file}` });
}
await browser.close();
