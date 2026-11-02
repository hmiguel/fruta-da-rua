<script lang="ts">
	import type { Feature, Point } from 'geojson';
	import FruitArt from '../art/FruitArt.svelte';
	import { speciesName, speciesNote, t } from '../i18n/index.svelte.ts';
	import type { EnrichedProps } from '../map/enrich.ts';
	import { speciesById } from '../species.ts';
	import { onMount } from 'svelte';
	import { app } from '../state.svelte.ts';
	import MonthsBar from './MonthsBar.svelte';

	let { tree, month, onClose }: { tree: Feature<Point, EnrichedProps>; month: number; onClose: () => void } = $props();

	const sp = $derived(speciesById(tree.properties.species)!);
	const [lng, lat] = $derived(tree.geometry.coordinates);
	let startY: number | null = null;
	let sheet: HTMLDivElement;

	// Move focus into the sheet so screen readers announce it, and give it back on close.
	onMount(() => {
		const opener = document.activeElement as HTMLElement | null;
		sheet.focus();
		return () => opener?.focus?.();
	});

	function onKey(e: KeyboardEvent) {
		// The About dialog sits on top; let it take Escape first.
		if (e.key === 'Escape' && !app.aboutOpen) onClose();
	}
</script>

<svelte:window onkeydown={onKey} />

<div
	class="sheet"
	role="dialog"
	aria-modal="false"
	aria-labelledby="tree-title"
	data-testid="tree-sheet"
	tabindex="-1"
	bind:this={sheet}
	ontouchstart={(e) => (startY = e.touches[0].clientY)}
	ontouchend={(e) => {
		if (startY !== null && e.changedTouches[0].clientY - startY > 80) onClose();
		startY = null;
	}}
>
	<button class="close" aria-label={t('sheet.close')} onclick={onClose}>×</button>
	<div class="plate">
		<FruitArt species={sp} size={104} eager />
		<div>
			<h2 id="tree-title">{speciesName(sp)}</h2>
			<p class="sci"><i>{sp.match[0].replace(/^./, (c) => c.toUpperCase())}</i></p>
			<p class="tag" class:on={tree.properties.pickable}>
				{t(`status.${tree.properties.status}`)} · {t(`tier.${sp.tier}`)}
			</p>
		</div>
	</div>

	<h3>{t('sheet.months')} <span>({t('app.estimate').toLowerCase()})</span></h3>
	<MonthsBar species={sp} {month} labels />

	<p class="note">{speciesNote(sp)}</p>
	{#if tree.properties.address || tree.properties.parish}
		<p class="place">
			{tree.properties.address ?? ''}
			{#if tree.properties.parish}<br /><span>{t('sheet.parish')}: {tree.properties.parish}</span>{/if}
		</p>
	{/if}
	<p class="etiquette">{t('sheet.etiquette')}</p>
	<a
		class="directions"
		href="https://www.google.com/maps/dir/?api=1&destination={lat},{lng}"
		target="_blank"
		rel="noopener">{t('sheet.directions')}</a
	>
</div>

<style>
	.sheet {
		position: absolute;
		z-index: 4;
		left: 0;
		right: 0;
		bottom: 0;
		max-height: 82dvh;
		overflow-y: auto;
		padding: 18px 18px max(18px, env(safe-area-inset-bottom));
		background: var(--sheet);
		border-top: 1.5px solid var(--ink);
		border-radius: 14px 16px 0 0;
		box-shadow: 0 -6px 18px rgb(58 50 38 / 0.16);
	}
	.sheet:focus {
		outline: none;
	}
	.close {
		position: absolute;
		top: 6px;
		right: 6px;
		width: 44px;
		height: 44px;
		border: 0;
		background: none;
		font-family: var(--font-hand);
		font-size: 1.8rem;
		line-height: 1;
	}
	.plate {
		display: flex;
		gap: 14px;
		align-items: center;
		padding-right: 36px;
	}
	h2 {
		margin: 0;
		font-family: var(--font-hand);
		font-weight: 700;
		font-size: 2rem;
		line-height: 1.1;
	}
	.sci {
		margin: 0;
		color: var(--pencil);
	}
	.tag {
		position: relative;
		display: inline-block;
		margin: 8px 0 0;
		padding: 2px 12px 2px 22px;
		background: var(--tag);
		border-radius: 3px 10px 10px 3px;
		font-size: 0.85rem;
	}
	.tag::before {
		content: '';
		position: absolute;
		left: 8px;
		top: 50%;
		width: 6px;
		height: 6px;
		margin-top: -3px;
		border-radius: 50%;
		background: var(--sheet);
		box-shadow: inset 0 0 0 1px var(--pencil);
	}
	.tag.on {
		background: var(--wash);
	}
	h3 {
		margin: 18px 0 8px;
		font-family: var(--font-hand);
		font-weight: 400;
		font-size: 1.1rem;
	}
	h3 span {
		color: var(--pencil);
		font-size: 0.95rem;
	}
	.note {
		margin: 16px 0 0;
	}
	.place {
		margin: 10px 0 0;
		font-size: 0.95rem;
	}
	.place span {
		color: var(--pencil);
	}
	.etiquette {
		margin: 16px 0;
		padding: 2px 0 2px 14px;
		border-left: 2px solid var(--ink);
		font-family: var(--font-hand);
		font-size: 1.05rem;
		line-height: 1.4;
		color: var(--pencil);
	}
	.directions {
		display: block;
		padding: 10px;
		border: 1.5px solid var(--ink);
		border-radius: 12px 14px 12px 16px;
		background: var(--wash);
		color: var(--ink);
		text-align: center;
		font-family: var(--font-hand);
		font-size: 1.15rem;
		font-weight: 700;
		text-decoration: none;
	}
	@media (min-width: 768px) {
		.sheet {
			top: 76px;
			left: auto;
			right: 16px;
			bottom: auto;
			width: 380px;
			border: 1.5px solid var(--ink);
			border-radius: 12px 16px 14px 12px;
		}
	}
</style>
