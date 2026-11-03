<script lang="ts">
	import FruitArt from '../art/FruitArt.svelte';
	import { chipList, type SpeciesCount } from '../filters.ts';
	import { speciesName, t } from '../i18n/index.svelte.ts';
	import { speciesById } from '../species.ts';
	import { app, chooseFruit } from '../state.svelte.ts';

	const MAX = 8;
	let { counts }: { counts: SpeciesCount[] } = $props();
	const chips = $derived(chipList(counts, app.filters.species, MAX));
</script>

<ul class="chips" aria-label={t('chips.label')} data-testid="chips">
	<li>
		<button
			class="chip"
			aria-pressed={app.filters.species.length === 0}
			data-testid="chip-all"
			onclick={() => (app.filters = { ...app.filters, species: [] })}>{t('chips.all')}</button
		>
	</li>
	{#each chips as c (c.species)}
		{@const sp = speciesById(c.species)}
		{#if sp}
			<li>
				<button
					class="chip"
					aria-pressed={app.filters.species.includes(sp.id)}
					data-testid="chip-{sp.id}"
					onclick={() => chooseFruit(sp.id, true)}
				>
					<FruitArt species={sp} size={26} />
					<span>{speciesName(sp)}</span>
					<span class="n">{c.count}</span>
				</button>
			</li>
		{/if}
	{/each}
	<li>
		<button class="chip" data-testid="chip-more" onclick={() => (app.searchOpen = true)}>{t('chips.more')}</button>
	</li>
</ul>

<style>
	.chips {
		display: flex;
		gap: 6px;
		margin: 0 -12px;
		padding: 8px 12px 6px;
		list-style: none;
		overflow-x: auto;
		scrollbar-width: none;
		overscroll-behavior-x: contain;
		pointer-events: auto;
	}
	.chips::-webkit-scrollbar {
		display: none;
	}
	li {
		flex: none;
	}
	.chip {
		display: flex;
		align-items: center;
		gap: 6px;
		height: 44px;
		padding: 0 14px;
		border: 1.5px solid var(--rule);
		border-radius: 16px 20px 18px 15px;
		background: var(--sheet);
		box-shadow: 0 2px 6px rgb(58 50 38 / 0.12);
		font-family: var(--font-hand);
		font-size: 1.1rem;
		white-space: nowrap;
	}
	.chip:has(:global(.art)) {
		padding-left: 8px;
	}
	.chip[aria-pressed='true'] {
		background: var(--wash);
		border-color: var(--ink);
	}
	.n {
		font-family: var(--font-text);
		font-size: 0.85rem;
		color: var(--pencil);
	}
	.chip[aria-pressed='true'] .n {
		color: var(--ink);
	}
</style>
