import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page, context }) => {
	await context.clearPermissions(); // geolocation denied by default
	await page.clock.setFixedTime(new Date('2026-11-15T12:00:00Z'));
});

const openFirstTree = (page: Page) =>
	page.evaluate(() => (window as unknown as { __openFirstTree?: () => void }).__openFirstTree?.());

test('November chips offer persimmon/pomegranate/olive, not fig', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('chip-pomegranate')).toBeVisible();
	await expect(page.getByTestId('chip-olive')).toBeVisible();
	await expect(page.getByTestId('chip-fig')).toHaveCount(0);
	await expect(page.getByTestId('chip-all')).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByTestId('visible-count')).toHaveText(/\d+ árvores nesta zona/);
});

test('language is chosen in the menu settings, keeps the filters, and stays', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('chip-olive').click();
	await page.getByTestId('menu-open').click();
	await page.getByTestId('settings-open').click();
	await expect(page.getByTestId('settings-back')).toBeFocused();
	await expect(page.getByTestId('lang-pt')).toHaveAttribute('aria-current', 'true');
	await page.getByTestId('lang-en').click();
	await expect(page).toHaveURL(/\/en\?fruta=olive$/);
	await expect(page.getByTestId('chip-olive')).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByTestId('toggle-pickable')).toHaveText('In season');
	await page.reload();
	await expect(page.getByTestId('toggle-pickable')).toHaveText('In season');
	expect(await page.locator('html').getAttribute('lang')).toBe('en');
});

test('a fruit page links to the map showing that fruit, in season or not', async ({ page }) => {
	await page.goto('/fruta/figo');
	await page.getByTestId('see-map').click();
	await expect(page.getByTestId('chip-fig')).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByTestId('toggle-pickable')).toHaveAttribute('aria-checked', 'false');
	await expect(page.getByTestId('visible-count')).toHaveText(/^[1-9]\d* árvores/);
});

test('geolocation denied keeps Lisbon and no error', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto('/');
	await page.getByRole('button', { name: /localiza|locate|find my location/i }).click();
	await expect(page.getByTestId('summary-panel')).toBeVisible();
	expect(errors).toEqual([]);
});

test('tapping a chip filters, tree sheet opens', async ({ page }) => {
	await page.goto('/?e2e=1');
	await page.getByTestId('chip-olive').click();
	await expect(page.getByTestId('chip-olive')).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByTestId('chip-all')).toHaveAttribute('aria-pressed', 'false');
	await openFirstTree(page);
	await expect(page.getByTestId('tree-sheet')).toContainText(/Colha só o que precisa/);
	await expect(page.getByTestId('tree-sheet')).toContainText('Azeitona');
	await page.keyboard.press('Escape');
	await expect(page.getByTestId('tree-sheet')).toHaveCount(0);
});

test('several fruits at once; All clears them', async ({ page }) => {
	await page.goto('/');
	const count = async () => Number((await page.getByTestId('visible-count').textContent())!.match(/\d+/)![0]);
	await page.getByTestId('chip-olive').click();
	const olives = await count();
	await page.getByTestId('chip-pomegranate').click();
	await expect(page.getByTestId('chip-olive')).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByTestId('chip-pomegranate')).toHaveAttribute('aria-pressed', 'true');
	expect(await count()).toBeGreaterThan(olives);
	await expect(page).toHaveURL(/\?fruta=azeitona,roma$/);
	await page.getByTestId('chip-all').click();
	await expect(page.getByTestId('chip-olive')).toHaveAttribute('aria-pressed', 'false');
	await expect(page).toHaveURL(/\/$/);
});

test('search finds a fruit without accents; an out-of-season pick shows its trees', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('search').fill('nespera');
	await page.getByTestId('result-loquat').click();
	await expect(page.getByTestId('search-results')).toHaveCount(0);
	await expect(page.getByTestId('chip-loquat')).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByTestId('toggle-pickable')).toHaveAttribute('aria-checked', 'false');
	await expect(page.getByTestId('visible-count')).toHaveText(/^[1-9]\d* árvores/);
});

test('"More" opens the full fruit list; Escape returns to the map', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('chip-more').click();
	await expect(page.getByTestId('search')).toBeFocused();
	await expect(page.getByTestId('search-results').getByRole('button')).toHaveCount(31);
	await page.keyboard.press('ArrowDown');
	await expect(page.getByTestId('search-results').getByRole('button').first()).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(page.getByTestId('search-results')).toHaveCount(0);
	await expect(page.getByTestId('chips')).toBeVisible();
});

test('no match explains what to do instead of an empty map', async ({ page }) => {
	await page.goto('/?fruta=figo');
	await expect(page.getByTestId('visible-count')).toHaveText('0 árvores nesta zona');
	await expect(page.getByTestId('empty')).toContainText('Experimente outro fruto ou desligue Na época');
	await page.getByRole('button', { name: 'Mostrar fora de época' }).click();
	await expect(page.getByTestId('empty')).toHaveCount(0);
	await expect(page).toHaveURL(/\?fruta=figo&epoca=0$/);
});

test('filters are remembered on the next visit', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('chip-olive').click();
	await page.getByTestId('toggle-pickable').click();
	await page.goto('/');
	await expect(page.getByTestId('chip-olive')).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByTestId('toggle-pickable')).toHaveAttribute('aria-checked', 'false');
});

test('month rolls over when the app comes back to the foreground', async ({ page }) => {
	await page.clock.setFixedTime(new Date('2026-11-30T12:00:00Z'));
	await page.goto('/');
	await expect(page.getByTestId('chip-olive')).toBeVisible();
	await page.getByTestId('chip-more').click();
	await expect(page.getByTestId('result-orange')).toHaveClass(/out/);
	await page.keyboard.press('Escape');
	await page.clock.setFixedTime(new Date('2026-12-01T12:00:00Z'));
	await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
	await page.getByTestId('chip-more').click();
	await expect(page.getByTestId('result-orange')).not.toHaveClass(/out/);
});

test('menu: feedback by email, Escape closes and gives focus back', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('menu-open').click();
	const menu = page.getByTestId('menu');
	await expect(menu).toBeFocused();
	await expect(menu.getByTestId('feedback')).toHaveAttribute('href', /^mailto:hugo@lixo\.dev\?subject=/);
	await page.getByTestId('settings-open').click();
	await page.getByTestId('settings-back').click();
	await expect(menu.getByTestId('settings-open')).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(menu).toHaveCount(0);
	await expect(page.getByTestId('menu-open')).toBeFocused();
});

test('map credits start folded so they do not cover the map', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('chip-all')).toBeVisible();
	const attrib = page.locator('.maplibregl-ctrl-attrib');
	await expect(attrib).toHaveClass(/maplibregl-compact/);
	await expect(attrib).not.toHaveClass(/maplibregl-compact-show/);
});
