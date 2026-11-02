import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	timeout: 30_000,
	use: {
		baseURL: 'http://localhost:4173',
		viewport: { width: 390, height: 844 },
		timezoneId: 'Europe/Lisbon',
		hasTouch: true
	},
	webServer: { command: 'npm run build && npm run preview', port: 4173, reuseExistingServer: !process.env.CI }
});
