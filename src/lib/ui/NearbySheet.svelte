<script lang="ts">
	import type { Feature, Point } from 'geojson';
	import FruitArt from '../art/FruitArt.svelte';
	import type { BBox } from '../geo.ts';
	import { i18n, speciesName, t, tn } from '../i18n/index.svelte.ts';
	import type { EnrichedProps } from '../map/enrich.ts';
	import { formatDistance, nearest } from '../nearby.ts';
	import { speciesById } from '../species.ts';
	import { app } from '../state.svelte.ts';

	const LIMIT = 40;
	let {
		trees,
		bounds,
		here,
		visible,
		status = null,
		height = $bindable(0)
	}: {
		trees: Feature<Point, EnrichedProps>[];
		bounds: BBox;
		/** The user's position when they shared it; otherwise distances run from the middle of the map. */
		here: [number, number] | null;
		visible: number;
		status?: string | null;
		height?: number;
	} = $props();

	const empty = $derived(!status && visible === 0);
	const from = $derived(here ?? [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2]);
	const list = $derived(nearest(trees, bounds, app.filters, from, LIMIT));

	// The list grows from nothing: closed it has no height, so the sheet never shifts on load.
	// Opening grows it to its natural height (`listH`); a drag grows it with the finger. Growing the
	// height, rather than sliding the panel with a transform, keeps the map drawn underneath.
	let listH = $state(0);
	let drag = $state<{ startY: number; base: number; dy: number; moved: boolean } | null>(null);
	let swallowClick = false;
	// Slide only when the person moves the sheet, never while it settles on load.
	let animate = $state(false);
	function setOpen(open: boolean) {
		animate = true;
		app.nearbyOpen = open;
	}
	const lift = $derived(drag ? Math.min(listH, Math.max(0, drag.base - drag.dy)) : app.nearbyOpen ? listH : 0);

	// Tracked on the window so the finger can leave the header; no pointer capture, which would
	// send the tap to the header instead of the button.
	function down(e: PointerEvent) {
		swallowClick = false;
		if ((e.target as HTMLElement).closest('.season, .link')) return;
		drag = { startY: e.clientY, base: app.nearbyOpen ? listH : 0, dy: 0, moved: false };
	}
	function move(e: PointerEvent) {
		if (!drag) return;
		drag.dy = e.clientY - drag.startY;
		if (Math.abs(drag.dy) > 6) drag.moved = true;
	}
	function up() {
		if (!drag) return;
		if (drag.moved) {
			// Settle on whichever side the finger was heading, or the nearer one for small moves.
			setOpen(drag.dy < -30 ? true : drag.dy > 30 ? false : drag.base - drag.dy > listH / 2);
			swallowClick = true;
		}
		drag = null;
	}
	function toggle() {
		if (swallowClick) return void (swallowClick = false);
		setOpen(!app.nearbyOpen);
	}

	function choose(tree: Feature<Point, EnrichedProps>) {
		setOpen(false);
		app.selectedTreeId = tree.properties.id;
		app.focus = tree.geometry.coordinates as [number, number];
	}
</script>

<svelte:window
	onpointermove={move}
	onpointerup={up}
	onpointercancel={up}
	onkeydown={(e) => e.key === 'Escape' && app.nearbyOpen && !app.menuOpen && !app.searchOpen && setOpen(false)}
/>

<div class="panel" class:animate={animate && !drag} data-testid="summary-panel" bind:clientHeight={height}>
	<div class="head" role="presentation" onpointerdown={down}>
		<span class="grip" aria-hidden="true"></span>
		<div class="row">
			<button
				class="grab"
				aria-expanded={app.nearbyOpen}
				aria-controls="nearby-list"
				data-testid="nearby-toggle"
				disabled={!!status}
				onclick={toggle}
			>
				<span class="count" role="status" data-testid="visible-count">{status ?? tn('panel.nearby', visible)}</span>
				<span class="sr-only">{t(app.nearbyOpen ? 'nearby.hide' : 'nearby.show')}</span>
			</button>
			<button
				class="season"
				role="switch"
				aria-checked={app.filters.onlyPickable}
				data-testid="toggle-pickable"
				onclick={() => (app.filters = { ...app.filters, onlyPickable: !app.filters.onlyPickable })}
			>
				<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
					<path class="leaf" d="M5 19c-.6-7.4 4.2-13 14-14 .6 9.3-5.1 14.6-14 14Z" />
					<path class="vein" d="M5 19c3.2-4.6 6.4-7.7 10-10" />
				</svg>
				{t('filter.onlyPickable')}
			</button>
		</div>
		{#if empty}
			<div class="empty" data-testid="empty">
				<p>{t(app.filters.species.length ? 'panel.none_fruit' : 'panel.none_season')}</p>
				{#if app.filters.onlyPickable}
					<button class="link" onclick={() => (app.filters = { ...app.filters, onlyPickable: false })}
						>{t('panel.show_out')}</button
					>
				{/if}
			</div>
		{/if}
	</div>

	<div
		class="list"
		id="nearby-list"
		data-testid="nearby-list"
		inert={!app.nearbyOpen}
		style:height="{lift}px"
		ontransitionend={() => (animate = false)}
	>
		<div class="scroll" bind:clientHeight={listH}>
			{#if list.items.length}
				<h3>{t(here ? 'nearby.from_you' : 'nearby.from_center')}</h3>
				<ul>
					{#each list.items as { tree, metres } (tree.properties.id)}
						{@const sp = speciesById(tree.properties.species)}
						{#if sp}
							<li>
								<button
									class="tree"
									class:out={!tree.properties.pickable}
									data-testid="nearby-row"
									onclick={() => choose(tree)}
								>
									<FruitArt species={sp} size={40} />
									<span class="name">
										<span class="fruit">{speciesName(sp)}</span>
										<span class="meta"
											>{tree.properties.address ?? tree.properties.parish ?? t('fruit.no_address')}</span
										>
									</span>
									<span class="far">{formatDistance(metres, i18n.lang)}</span>
								</button>
							</li>
						{/if}
					{/each}
				</ul>
				{#if list.total > list.items.length}
					<p class="more">{t('nearby.more', { n: list.total - list.items.length })}</p>
				{/if}
			{:else if !empty}
				<p class="more">{t('nearby.none')}</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.panel {
		position: absolute;
		z-index: 2;
		left: 0;
		right: 0;
		bottom: 0;
		padding-bottom: env(safe-area-inset-bottom);
		background: var(--sheet);
		border-top: 1.5px solid var(--ink);
		border-radius: 14px 16px 0 0;
		box-shadow: 0 -4px 14px rgb(58 50 38 / 0.12);
	}
	.panel.animate .list {
		transition: height 0.25s ease;
	}
	@media (prefers-reduced-motion: reduce) {
		.panel.animate .list {
			transition: none;
		}
	}

	.head {
		position: relative;
		padding: 14px 12px 10px 16px;
		touch-action: none;
	}
	.grip {
		position: absolute;
		top: 6px;
		left: 50%;
		width: 42px;
		height: 4px;
		margin-left: -21px;
		border-radius: 2px;
		background: var(--rule);
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}
	.grab {
		flex: 1;
		min-width: 0;
		min-height: 44px;
		padding: 0;
		border: 0;
		background: none;
		text-align: left;
	}
	.count {
		font-family: var(--font-hand);
		font-size: 1.25rem;
		font-weight: 700;
		line-height: 1.2;
	}
	.season {
		flex: none;
		display: flex;
		align-items: center;
		gap: 6px;
		height: 44px;
		padding: 0 14px 0 10px;
		border: 1.5px solid var(--rule);
		border-radius: 16px 20px 18px 15px;
		background: var(--sheet);
		font-family: var(--font-hand);
		font-size: 1.1rem;
		white-space: nowrap;
	}
	.season[aria-checked='true'] {
		background: var(--wash);
		border-color: var(--ink);
	}
	.leaf {
		fill: none;
		stroke: var(--ink);
		stroke-width: 1.6;
		stroke-linejoin: round;
	}
	.season[aria-checked='true'] .leaf {
		fill: #8fb573;
	}
	.vein {
		fill: none;
		stroke: var(--ink);
		stroke-width: 1.3;
		stroke-linecap: round;
	}
	.empty p {
		margin: 8px 0 0;
		color: var(--pencil);
	}
	.link {
		min-height: 44px;
		padding: 0;
		border: 0;
		background: none;
		font-family: var(--font-hand);
		font-size: 1.1rem;
		text-decoration: underline wavy;
		text-underline-offset: 4px;
	}
	.list {
		overflow: hidden;
		border-top: 1px solid var(--rule);
	}
	.scroll {
		max-height: 55dvh;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding-bottom: 10px;
	}
	h3 {
		margin: 10px 20px 4px;
		font-family: var(--font-hand);
		font-weight: 400;
		font-size: 1.1rem;
		color: var(--pencil);
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	/* Same row as the menu and the search results. */
	.tree {
		width: calc(100% - 16px);
		display: grid;
		grid-template-columns: 40px 1fr auto;
		align-items: center;
		gap: 12px;
		min-height: 56px;
		margin: 1px 8px;
		padding: 6px 12px;
		border: 0;
		border-radius: 12px 14px 12px 13px;
		background: none;
		text-align: left;
	}
	.tree:active {
		background: var(--wash);
	}
	.tree.out :global(.art) {
		opacity: 0.5;
	}
	.name {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.fruit {
		font-family: var(--font-hand);
		font-size: 1.2rem;
		line-height: 1.2;
	}
	.meta {
		overflow: hidden;
		font-size: 0.85rem;
		color: var(--pencil);
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.far {
		font-size: 0.9rem;
		color: var(--pencil);
		white-space: nowrap;
	}
	.more {
		margin: 10px 20px;
		font-size: 0.9rem;
		color: var(--pencil);
	}
	@media (min-width: 768px) {
		.panel {
			left: 16px;
			right: auto;
			width: 390px;
			border: 1.5px solid var(--ink);
			border-bottom: 0;
			border-radius: 12px 16px 0 0;
		}
	}
</style>
