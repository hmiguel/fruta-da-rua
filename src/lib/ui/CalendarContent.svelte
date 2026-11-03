<script lang="ts">
	import { onMount } from 'svelte';
	import FruitArt from '../art/FruitArt.svelte';
	import { monthsSentence } from '../fruit-stats.ts';
	import { i18n, monthShort, speciesName, t } from '../i18n/index.svelte.ts';
	import { lisbonMonth } from '../season.ts';
	import { EDIBLE, fruitPath } from '../site.ts';
	import MonthsBar from './MonthsBar.svelte';

	/** The fruit calendar, shared by the /fruta page and the menu. */
	const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
	// In harvest order through the year, starting with what ripens first.
	const fruits = $derived(
		[...EDIBLE].sort((a, b) => a.ripe[0] - b.ripe[0] || speciesName(a).localeCompare(speciesName(b), 'pt'))
	);

	let month = $state(0);
	onMount(() => (month = lisbonMonth(new Date())));
</script>

<div class="calendar" data-testid="calendar">
	<p class="intro">{t('calendar.intro')}</p>
	<div class="months" aria-hidden="true">
		{#each MONTHS as m (m)}<span class:now={m === month}>{monthShort(m).slice(0, 1)}</span>{/each}
	</div>
	<ul>
		{#each fruits as s (s.id)}
			<li>
				<a class="row" href={fruitPath(s, i18n.lang)}>
					<FruitArt species={s} size={40} />
					<span class="name">
						<span class="fruit">{speciesName(s)}</span>
						<span class="when">{monthsSentence(s.ripe, i18n.lang)}</span>
					</span>
					<span class="strip"><MonthsBar species={s} {month} /></span>
				</a>
			</li>
		{/each}
	</ul>
</div>

<style>
	.calendar {
		--strip: min(120px, 32vw);
	}
	.intro {
		margin: 0 20px 14px;
	}
	.months {
		display: grid;
		grid-template-columns: repeat(12, 1fr);
		width: var(--strip);
		margin: 0 20px 2px auto;
		font-size: 11px;
		text-align: center;
		color: var(--pencil);
	}
	.months .now {
		color: var(--ink);
		font-weight: 600;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	/* Same row as the menu, the search results and the nearby list. */
	.row {
		display: grid;
		grid-template-columns: 40px 1fr var(--strip);
		align-items: center;
		gap: 12px;
		width: calc(100% - 16px);
		min-height: 56px;
		margin: 1px 8px;
		padding: 6px 12px;
		border-radius: 12px 14px 12px 13px;
		color: var(--ink);
		text-decoration: none;
	}
	.row:active {
		background: var(--wash);
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
	.when {
		font-size: 0.85rem;
		color: var(--pencil);
	}
</style>
