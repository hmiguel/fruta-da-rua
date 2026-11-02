// Draws the social sharing images (1200×630) into static/og/: one for the home page and one
// per fruit. Run after changing names, art or data: node scripts/make-og.ts
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { fruitSvg } from '../src/lib/art/fruit-art.ts';
import { monthsSentence } from '../src/lib/fruit-stats.ts';
import { EDIBLE, SITE_NAME } from '../src/lib/site.ts';

const font = (file: string) => readFileSync(`node_modules/@fontsource/${file}`).toString('base64');
const CSS = `
@font-face { font-family: Kalam; font-weight: 700; src: url(data:font/woff2;base64,${font('kalam/files/kalam-latin-700-normal.woff2')}); }
@font-face { font-family: Spectral; src: url(data:font/woff2;base64,${font('spectral/files/spectral-latin-400-normal.woff2')}); }
body { margin: 0; width: 1200px; height: 630px; background: #eef0e4; color: #3a3226; font-family: Spectral; display: flex; align-items: center; gap: 48px; padding: 0 80px; box-sizing: border-box; }
h1 { font-family: Kalam; font-weight: 700; font-size: 92px; line-height: 1; margin: 0 0 18px; }
p { font-size: 36px; margin: 0; color: #6e695a; }
.site { font-family: Kalam; font-weight: 700; font-size: 34px; color: #3a3226; margin-top: 36px; }
.row { display: flex; gap: 8px; margin-top: 30px; }`;

const trees = JSON.parse(readFileSync('static/meta.json', 'utf8')).by_species as Record<string, number>;
mkdirSync('static/og', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
const shoot = async (html: string, file: string) => {
	await page.setContent(`<style>${CSS}</style>${html}`);
	await page.evaluate(() => document.fonts.ready);
	await page.screenshot({ path: `static/og/${file}` });
};

const showcase = ['loquat', 'fig', 'pomegranate', 'orange', 'persimmon', 'mulberry'];
await shoot(
	`<div><h1>${SITE_NAME}</h1><p>Árvores de fruto de Lisboa, na época certa.</p>` +
		`<div class="row">${showcase.map((id) => fruitSvg(EDIBLE.find((s) => s.id === id)!, 150)).join('')}</div></div>`,
	'home.png'
);
for (const s of EDIBLE) {
	const n = trees[s.id] ?? 0;
	await shoot(
		`${fruitSvg(s, 400)}<div><h1>${s.name_pt}</h1><p>${n} ${s.tree_pt[n === 1 ? 0 : 1]} em Lisboa,<br>${monthsSentence(s.ripe, 'pt')}.</p><div class="site">${SITE_NAME}</div></div>`,
		`${s.id}.png`
	);
}
await browser.close();
console.log(`Wrote ${EDIBLE.length + 1} images to static/og/`);
