import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page, context }) => {
	await context.clearPermissions(); // geolocation denied by default
	await page.clock.setFixedTime(new Date('2026-11-15T12:00:00Z'));
});

test('November shows persimmon/pomegranate/olive, not fig', async ({ page }) => {
	await page.goto('/');
	const panel = page.getByTestId('season-panel');
	await expect(panel.getByTestId('fruit-pomegranate')).toBeVisible();
	await expect(panel.getByTestId('fruit-olive')).toBeVisible();
	await expect(panel.getByTestId('fruit-fig')).toHaveCount(0);
});

test('language switch goes to the English page and stays there', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('Estimativa')).toBeVisible();
	await page.getByTestId('lang').click();
	await expect(page).toHaveURL(/\/en$/);
	await expect(page.getByText('Estimate', { exact: true })).toBeVisible();
	await page.reload();
	await expect(page.getByText('Estimate', { exact: true })).toBeVisible();
	expect(await page.locator('html').getAttribute('lang')).toBe('en');
});

test('a fruit page links to the map showing that fruit', async ({ page }) => {
	await page.goto('/fruta/figo');
	await page.getByTestId('see-map').click();
	await expect(page.getByTestId('fruit-fig')).toHaveAttribute('aria-pressed', 'true');
});

test('geolocation denied keeps Lisbon and no error', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto('/');
	await page.getByRole('button', { name: /localiza|locate|find my location/i }).click();
	await expect(page.getByTestId('season-panel')).toBeVisible();
	expect(errors).toEqual([]);
});

test('tapping a fruit row filters, tree sheet opens', async ({ page }) => {
	await page.goto('/?e2e=1');
	await page.getByTestId('fruit-olive').click();
	await expect(page.getByTestId('fruit-olive')).toHaveAttribute('aria-pressed', 'true');
	await page.evaluate(() => (window as unknown as { __openFirstTree?: () => void }).__openFirstTree?.());
	await expect(page.getByTestId('tree-sheet')).toContainText(/Colha só o que precisa/);
	await expect(page.getByTestId('tree-sheet')).toContainText('Azeitona');
	await page.keyboard.press('Escape');
	await expect(page.getByTestId('tree-sheet')).toHaveCount(0);
});

test('month rolls over when the app comes back to the foreground', async ({ page }) => {
	await page.clock.setFixedTime(new Date('2026-11-30T12:00:00Z'));
	await page.goto('/');
	const panel = page.getByTestId('season-panel');
	await expect(panel.getByTestId('fruit-olive')).toBeVisible();
	await expect(panel.getByTestId('fruit-orange')).toHaveClass(/soon/);
	const pickable = panel.getByTestId('fruit-orange').and(page.locator(':not(.soon)'));
	await page.clock.setFixedTime(new Date('2026-12-01T12:00:00Z'));
	await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
	await expect(pickable).toHaveCount(1);
});

test('tapping a "soon" fruit still shows its trees', async ({ page }) => {
	await page.goto('/?e2e=1');
	await page.getByTestId('fruit-orange').click();
	await page.evaluate(() => (window as unknown as { __openFirstTree?: () => void }).__openFirstTree?.());
	await expect(page.getByTestId('tree-sheet')).toContainText('Laranja');
});
