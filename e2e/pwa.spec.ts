import { expect, test } from '@playwright/test';

test('web manifest is installable', async ({ request }) => {
	const res = await request.get('/manifest.webmanifest');
	expect(res.ok()).toBe(true);
	const m = await res.json();
	expect(m.name).toBe('Fruta da Rua');
	expect(m.display).toBe('standalone');
	const sizes = m.icons.map((i: { sizes: string }) => i.sizes);
	expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
	for (const icon of m.icons) expect((await request.get(icon.src)).ok()).toBe(true);
});

test('service worker activates', async ({ page }) => {
	await page.goto('/');
	const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
	expect(scope).toContain('localhost');
});

test('about dialog credits the data and shows its date', async ({ page }) => {
	await page.goto('/');
	await page.getByTestId('about-open').click();
	const about = page.getByTestId('about');
	await expect(about).toContainText('CC0');
	await expect(about).toContainText(/Muita Fruta/);
	await expect(about).toContainText(/\d{4}/);
	await page.keyboard.press('Escape');
	await expect(about).toHaveCount(0);
});
