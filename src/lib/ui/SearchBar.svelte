<script lang="ts">
	import FruitArt from '../art/FruitArt.svelte';
	import { searchFruits } from '../filters.ts';
	import { speciesName, t, tn } from '../i18n/index.svelte.ts';
	import { isPickable, seasonStatus } from '../season.ts';
	import { app, chooseFruit, topLayer } from '../state.svelte.ts';

	let { now, totals }: { now: Date; totals: Map<string, number> } = $props();

	let query = $state('');
	let input: HTMLInputElement;
	let list: HTMLUListElement | undefined = $state();
	const results = $derived(app.searchOpen ? searchFruits(query, now) : []);

	// "More" opens the search from elsewhere: put the cursor in the box.
	$effect(() => {
		if (app.searchOpen && document.activeElement !== input) input.focus();
	});

	function open() {
		app.searchOpen = true;
		app.selectedTreeId = null;
	}

	function close() {
		app.searchOpen = false;
		query = '';
	}

	function pick(id: string, pickable: boolean) {
		chooseFruit(id, pickable);
		close();
		input.blur();
	}

	/** Arrow keys move between the input and the results, like a list. */
	function arrows(e: KeyboardEvent) {
		if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
		const items = [...(list?.querySelectorAll<HTMLElement>('button') ?? [])];
		if (!items.length) return;
		e.preventDefault();
		const i = items.indexOf(document.activeElement as HTMLElement);
		const next = e.key === 'ArrowDown' ? i + 1 : i - 1;
		if (next < 0) input.focus();
		else items[Math.min(next, items.length - 1)].focus();
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape' && topLayer() === 'search') {
			close();
			input.focus();
		}
	}
</script>

<svelte:window onkeydown={onKey} />

<div class="bar" class:open={app.searchOpen}>
	<button
		id="menu-button"
		class="icon"
		aria-label={t('menu.open')}
		aria-expanded={app.menuOpen}
		aria-controls="menu"
		data-testid="menu-open"
		onclick={() => (app.menuOpen = true)}
	>
		<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
			<path d="M4 7.2c5.3-.5 10.6-.4 16 .1M4 12.1c5.1.3 10.4-.2 16 0M4 16.9c5.6-.4 10.9.2 16-.2" />
		</svg>
	</button>
	<label class="sr-only" for="fruit-search">{t('search.label')}</label>
	<input
		id="fruit-search"
		type="search"
		autocomplete="off"
		enterkeyhint="search"
		placeholder={t('search.label')}
		aria-controls={app.searchOpen ? 'fruit-results' : undefined}
		data-testid="search"
		bind:value={query}
		bind:this={input}
		onclick={open}
		oninput={open}
		onkeydown={arrows}
		onkeyup={(e) => e.key === 'Enter' && results[0] && pick(results[0].id, isPickable(seasonStatus(results[0], now)))}
	/>
	{#if app.searchOpen}
		<button class="icon" aria-label={t('search.close')} onclick={close}>
			<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
				<path d="M6.2 6c4 3.8 7.8 7.9 11.6 12M17.8 6.1c-4.1 3.7-7.9 7.8-11.7 11.8" />
			</svg>
		</button>
	{/if}
</div>

{#if app.searchOpen}
	<div class="results" id="fruit-results" data-testid="search-results">
		<p class="sr-only" role="status">
			{results.length ? tn('search.results', results.length) : t('search.none')}
		</p>
		{#if results.length}
			<ul bind:this={list} aria-label={t('search.label')}>
				{#each results as sp (sp.id)}
					{@const status = seasonStatus(sp, now)}
					{@const pickable = isPickable(status)}
					<li>
						<button
							class="row"
							class:out={!pickable}
							data-testid="result-{sp.id}"
							aria-pressed={app.filters.species.includes(sp.id)}
							onclick={() => pick(sp.id, pickable)}
							onkeydown={arrows}
						>
							<FruitArt species={sp} size={40} />
							<span class="name">
								<span class="fruit">{speciesName(sp)}</span>
								<span class="meta">{t(`status.${status}`)} · {tn('panel.trees', totals.get(sp.id) ?? 0)}</span>
							</span>
							<span class="tick" aria-hidden="true">{app.filters.species.includes(sp.id) ? '✓' : ''}</span>
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="none">{t('search.none')}</p>
		{/if}
	</div>
{/if}

<style>
	.bar {
		display: flex;
		align-items: center;
		gap: 2px;
		height: 52px;
		padding: 0 4px;
		background: var(--sheet);
		border: 1.5px solid var(--ink);
		border-radius: 14px 18px 15px 16px;
		box-shadow: 0 3px 10px rgb(58 50 38 / 0.14);
		pointer-events: auto;
	}
	.icon {
		flex: none;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: 0;
		border-radius: 50%;
		background: none;
	}
	.icon path {
		fill: none;
		stroke: var(--ink);
		stroke-width: 2;
		stroke-linecap: round;
	}
	input {
		flex: 1;
		min-width: 0;
		height: 44px;
		padding: 0 6px;
		border: 0;
		background: none;
		color: var(--ink);
		font-family: var(--font-hand);
		font-size: 1.2rem;
	}
	input::placeholder {
		color: var(--pencil);
		opacity: 1;
	}
	input:focus {
		outline: none;
	}
	.bar:focus-within {
		outline: 2px dashed var(--ink);
		outline-offset: 3px;
	}
	input::-webkit-search-cancel-button {
		display: none;
	}
	.results {
		margin-top: 8px;
		max-height: calc(100dvh - 90px - env(safe-area-inset-top));
		overflow-y: auto;
		overscroll-behavior: contain;
		background: var(--sheet);
		border: 1.5px solid var(--ink);
		border-radius: 12px 16px 14px 12px;
		box-shadow: 0 6px 18px rgb(58 50 38 / 0.18);
		pointer-events: auto;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 4px 0;
	}
	li + li .row {
		border-top: 1px solid var(--rule);
	}
	.row {
		width: 100%;
		display: grid;
		grid-template-columns: 40px 1fr 24px;
		align-items: center;
		gap: 12px;
		min-height: 56px;
		padding: 6px 14px;
		border: 0;
		background: none;
		text-align: left;
	}
	.row[aria-pressed='true'] {
		background: var(--wash);
	}
	.row.out :global(.art) {
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
		font-size: 0.85rem;
		color: var(--pencil);
	}
	.tick {
		font-weight: 700;
		text-align: center;
	}
	.none {
		margin: 0;
		padding: 16px;
		font-family: var(--font-hand);
		font-size: 1.1rem;
		color: var(--pencil);
	}
</style>
