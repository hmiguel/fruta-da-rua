import { expect, test } from 'vitest';
import { installHow } from './install.svelte.ts';

const IPHONE =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPAD_AS_MAC =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const ANDROID =
	'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';
const DESKTOP = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

test('an installed app offers nothing', () => {
	expect(installHow({ ua: ANDROID, touch: 5, standalone: true, prompt: true })).toBe('installed');
});

test('when the browser can install by itself, use that', () => {
	expect(installHow({ ua: ANDROID, touch: 5, standalone: false, prompt: true })).toBe('prompt');
	expect(installHow({ ua: DESKTOP, touch: 0, standalone: false, prompt: true })).toBe('prompt');
});

test('iPhone and iPad (which says it is a Mac) get the Share steps', () => {
	expect(installHow({ ua: IPHONE, touch: 5, standalone: false, prompt: false })).toBe('ios');
	expect(installHow({ ua: IPAD_AS_MAC, touch: 5, standalone: false, prompt: false })).toBe('ios');
	expect(installHow({ ua: IPAD_AS_MAC, touch: 0, standalone: false, prompt: false })).toBe('browser');
});

test('other browsers get the browser-menu steps', () => {
	expect(installHow({ ua: ANDROID, touch: 5, standalone: false, prompt: false })).toBe('browser');
});
