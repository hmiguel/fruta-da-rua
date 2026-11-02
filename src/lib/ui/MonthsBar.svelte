<script lang="ts">
	import { monthShort } from '../i18n/index.svelte.ts';
	import type { Species } from '../types.ts';

	let { species, month, labels = false }: { species: Species; month: number; labels?: boolean } = $props();
	const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
	const ripe = (m: number) => species.ripe.includes(m);
	const prev = (m: number) => ((m + 10) % 12) + 1;
	const next = (m: number) => (m % 12) + 1;
</script>

<!-- A watercolour brush stroke under the harvest months; the current month is circled in ink. -->
<div class="bar" class:labels role="img" aria-label={species.ripe.map(monthShort).join(', ')}>
	{#each MONTHS as m (m)}
		<span class="cell">
			<span
				class="stroke"
				class:on={ripe(m)}
				class:peak={species.peak.includes(m)}
				class:start={ripe(m) && !ripe(prev(m))}
				class:end={ripe(m) && !ripe(next(m))}
				style:--c={species.color}
			></span>
			{#if labels}<span class="label" class:now={m === month}>{monthShort(m).replace('.', '').slice(0, 3)}</span>
			{:else if m === month}<span class="mark"></span>{/if}
		</span>
	{/each}
</div>

<style>
	.bar {
		display: grid;
		grid-template-columns: repeat(12, 1fr);
		align-items: center;
	}
	.cell {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}
	.stroke {
		width: 100%;
		height: 9px;
	}
	.stroke.on {
		background: color-mix(in srgb, var(--c) 45%, transparent);
	}
	.stroke.peak {
		background: color-mix(in srgb, var(--c) 85%, transparent);
	}
	.stroke.start {
		border-radius: 6px 2px 2px 7px;
	}
	.stroke.end {
		border-radius: 2px 7px 6px 2px;
	}
	.stroke.start.end {
		border-radius: 6px 8px 5px 7px;
	}
	.mark {
		position: absolute;
		top: -5px;
		bottom: -5px;
		left: 50%;
		width: 1.5px;
		margin-left: -0.75px;
		background: var(--ink);
		border-radius: 1px;
	}
	.labels .stroke {
		height: 14px;
	}
	.label {
		font-family: var(--font-text);
		font-size: 11px;
		color: var(--pencil);
	}
	.label.now {
		color: var(--ink);
		font-weight: 600;
		text-decoration: underline wavy;
		text-underline-offset: 3px;
	}
</style>
