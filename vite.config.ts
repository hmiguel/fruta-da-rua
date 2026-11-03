import { sveltekit } from '@sveltejs/kit/vite';
import { execSync } from 'node:child_process';
import { defineConfig } from 'vitest/config';

/** The commit being built: Cloudflare Pages sets it, otherwise ask git. Empty when neither knows. */
function commit(): string {
	if (process.env.CF_PAGES_COMMIT_SHA) return process.env.CF_PAGES_COMMIT_SHA;
	try {
		return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.trim();
	} catch {
		return '';
	}
}

export default defineConfig({
	plugins: [sveltekit()],
	define: { __COMMIT__: JSON.stringify(commit()) },
	test: { include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'] }
});
