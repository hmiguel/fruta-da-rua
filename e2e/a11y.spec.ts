import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function noViolations(page: Page, label: string) {
	const { violations } = await new AxeBuilder({ page }).withTags(WCAG).exclude('.maplibregl-canvas').analyze();
	expect(
		violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
		label
	).toEqual([]);
}

test.beforeEach(async ({ page }) => {
	await page.clock.setFixedTime(new Date('2026-11-15T12:00:00Z'));
});

for (const path of ['/', '/en', '/fruta', '/fruta/nespera', '/en/fruit/fig']) {
	test(`axe: ${path}`, async ({ page }) => {
		await page.goto(path);
		await page.waitForLoadState('networkidle');
		await noViolations(page, path);
	});
}

test('axe: tree sheet, menu, About and search', async ({ page }) => {
	await page.goto('/?e2e=1');
	await page.getByTestId('chip-olive').click();
	await page.evaluate(() => (window as unknown as { __openFirstTree: () => void }).__openFirstTree());
	await expect(page.getByTestId('tree-sheet')).toBeFocused();
	await noViolations(page, 'tree sheet');
	await page.getByTestId('menu-open').click();
	await noViolations(page, 'menu');
	await page.getByTestId('settings-open').click();
	await noViolations(page, 'settings');
	await page.getByTestId('panel-back').click();
	await page.getByTestId('calendar-open').click();
	await noViolations(page, 'calendar in menu');
	await page.getByTestId('panel-back').click();
	await page.getByTestId('install-open').click();
	await noViolations(page, 'install steps');
	await page.getByTestId('panel-back').click();
	await page.getByTestId('about-open').click();
	await noViolations(page, 'about');
	await page.getByTestId('panel-back').click();
	await page.getByTestId('etiquette-open').click();
	await noViolations(page, 'etiquette');
	await page.keyboard.press('Escape');
	await page.getByTestId('chip-more').click();
	await noViolations(page, 'search');
	await page.keyboard.press('Escape');
	await page.getByTestId('nearby-toggle').click();
	await noViolations(page, 'nearby list');
});

test('keyboard: skip link first, menu traps focus, back returns to the row, Escape closes only the menu', async ({
	page
}) => {
	await page.goto('/?e2e=1');
	await page.keyboard.press('Tab');
	await expect(page.getByRole('link', { name: 'Saltar para a pesquisa de frutos' })).toBeFocused();
	await page.getByTestId('chip-olive').click();
	await page.evaluate(() => (window as unknown as { __openFirstTree: () => void }).__openFirstTree());
	await page.getByTestId('menu-open').focus();
	await page.keyboard.press('Enter');
	await page.getByTestId('about-open').focus();
	await page.keyboard.press('Enter');
	await expect(page.getByTestId('about')).toBeVisible();
	await expect(page.getByTestId('panel-back')).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(page.getByTestId('about-open')).toBeFocused();
	for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
	expect(await page.getByTestId('menu').evaluate((d) => d.contains(document.activeElement))).toBe(true);
	await page.keyboard.press('Escape');
	await expect(page.getByTestId('menu')).toHaveCount(0);
	await expect(page.getByTestId('tree-sheet')).toBeVisible();
	await expect(page.getByTestId('menu-open')).toBeFocused();
});

for (const width of [360, 390]) {
	test(`phone ${width}px: no sideways scroll, touch targets at least 44px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 760 });
		for (const path of ['/', '/fruta', '/fruta/nespera']) {
			await page.goto(path);
			await page.waitForLoadState('networkidle');
			expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(width);
			const small = await page.evaluate(() =>
				[...document.querySelectorAll<HTMLElement>('button, header a, nav a, .cta, summary')]
					.filter((el) => el.offsetParent !== null && !el.classList.contains('skip'))
					.map((el) => ({ el, r: el.getBoundingClientRect() }))
					.filter(({ r }) => r.width > 0 && (r.width < 44 || r.height < 44))
					.map(
						({ el, r }) =>
							`${el.tagName} "${el.textContent?.trim().slice(0, 20)}" ${Math.round(r.width)}x${Math.round(r.height)}`
					)
			);
			expect(small, path).toEqual([]);
		}
	});
}
