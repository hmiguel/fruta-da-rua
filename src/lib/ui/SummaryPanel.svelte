<script lang="ts">
	import { t, tn } from '../i18n/index.svelte.ts';
	import { app } from '../state.svelte.ts';

	let {
		visible,
		status = null,
		height = $bindable(0)
	}: { visible: number; status?: string | null; height?: number } = $props();

	const empty = $derived(!status && visible === 0);
</script>

<div class="panel" data-testid="summary-panel" bind:clientHeight={height}>
	<div class="row">
		<p class="count" role="status" data-testid="visible-count">
			{status ?? tn('panel.nearby', visible)}
		</p>
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

<style>
	.panel {
		position: absolute;
		z-index: 2;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 10px 12px max(10px, env(safe-area-inset-bottom)) 16px;
		background: var(--sheet);
		border-top: 1.5px solid var(--ink);
		border-radius: 14px 16px 0 0;
		box-shadow: 0 -4px 14px rgb(58 50 38 / 0.12);
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}
	.count {
		margin: 0;
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
	@media (min-width: 768px) {
		.panel {
			left: 16px;
			right: auto;
			bottom: 16px;
			width: 390px;
			border: 1.5px solid var(--ink);
			border-radius: 12px 16px 14px 12px;
		}
	}
</style>
