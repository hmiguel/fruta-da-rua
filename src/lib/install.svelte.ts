/** Adding the app to the home screen: the browser's own prompt where there is one, steps otherwise. */

interface InstallPrompt extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const install = $state({ prompt: null as InstallPrompt | null, installed: false });

export type InstallHow = 'installed' | 'prompt' | 'ios' | 'browser';

export function installHow(d: { ua: string; touch: number; standalone: boolean; prompt: boolean }): InstallHow {
	if (d.standalone) return 'installed';
	if (d.prompt) return 'prompt';
	// iPadOS Safari introduces itself as a Mac; touch gives it away.
	if (/iphone|ipad|ipod/i.test(d.ua) || (/macintosh/i.test(d.ua) && d.touch > 1)) return 'ios';
	return 'browser';
}

/** Call once on start: Chrome fires its install event early, before any menu is open. */
export function listenForInstall(): void {
	install.installed =
		matchMedia('(display-mode: standalone)').matches ||
		(navigator as Navigator & { standalone?: boolean }).standalone === true;
	addEventListener('beforeinstallprompt', (e) => {
		e.preventDefault(); // we offer it in the menu instead of Chrome's own banner
		install.prompt = e as InstallPrompt;
	});
	addEventListener('appinstalled', () => {
		install.installed = true;
		install.prompt = null;
	});
}

export const currentInstallHow = (): InstallHow =>
	installHow({
		ua: navigator.userAgent,
		touch: navigator.maxTouchPoints,
		standalone: install.installed,
		prompt: !!install.prompt
	});
