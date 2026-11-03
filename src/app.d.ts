declare global {
	namespace App {}
	/** Full hash of the commit the site was built from, or '' (see vite.config.ts). */
	const __COMMIT__: string;
}
export {};
