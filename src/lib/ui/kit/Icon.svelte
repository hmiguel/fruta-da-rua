<script lang="ts" module>
	/** Pen-drawn line icons: slightly uneven strokes to sit with the handwriting. */
	const PATHS = {
		menu: 'M4 7.2c5.3-.5 10.6-.4 16 .1M4 12.1c5.1.3 10.4-.2 16 0M4 16.9c5.6-.4 10.9.2 16-.2',
		close: 'M6.2 6c4 3.8 7.8 7.9 11.6 12M17.8 6.1c-4.1 3.7-7.9 7.8-11.7 11.8',
		back: 'M15 5.2c-2.6 2.2-4.9 4.4-7 6.9 2.2 2.3 4.5 4.6 7.1 6.8',
		forward: 'M9.2 5.2c2.6 2.2 4.9 4.4 7 6.9-2.2 2.3-4.5 4.6-7.1 6.8',
		map: 'M4 6.3c1.7-.7 3.4-1.3 5-1.9 2 .7 4 1.4 6 2 1.7-.6 3.4-1.3 5-1.9.1 4.4.1 8.9 0 13.3-1.7.6-3.4 1.2-5 1.8-2-.7-4-1.3-6-2-1.7.6-3.3 1.3-5 1.9-.1-4.4-.1-8.8 0-13.2ZM9 4.6c.1 4.3.1 8.6 0 12.9M15 6.5c-.1 4.4 0 8.8 0 13.1',
		calendar:
			'M4.5 6.6c5-.3 10-.2 15 .1.3 4.5.2 9 0 13.4-5 .3-10 .2-15-.1-.2-4.5-.2-9 0-13.4ZM4.7 10.3c5 .2 9.9 0 14.7.1M8.5 4.1v4M15.5 4v4',
		info: 'M12 3.6c4.8-.1 8.5 3.6 8.4 8.5-.1 4.7-3.8 8.3-8.5 8.3-4.7-.1-8.4-3.8-8.3-8.5.1-4.7 3.7-8.2 8.4-8.3ZM12.1 11c-.1 1.8 0 3.6 0 5.4M12 7.7v.3',
		settings: 'M4 7.6c5.4-.3 10.7 0 16-.1M4 16.5c5.3.2 10.6 0 16 0M9 5.1c-.1 1.7 0 3.4 0 5M15.1 14c-.1 1.7 0 3.4 0 5',
		leaf: 'M5 19c-.6-7.4 4.2-13 14-14 .6 9.3-5.1 14.6-14 14ZM5 19c3.2-4.6 6.4-7.7 10-10',
		mail: 'M4 6.6c5.3-.3 10.7-.2 16 .1.2 3.6.1 7.2 0 10.8-5.3.3-10.7.2-16-.1-.2-3.6-.2-7.2 0-10.8ZM4.3 7.1c2.6 2.1 5.1 4.1 7.7 5.8 2.6-1.7 5.2-3.7 7.7-5.8'
	} as const;
	export type IconName = keyof typeof PATHS;
</script>

<script lang="ts">
	let { name, size = 22 }: { name: IconName; size?: number } = $props();
</script>

<svg class="icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
	<path d={PATHS[name]} />
</svg>

<style>
	.icon {
		flex: none;
	}
	path {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.9;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
