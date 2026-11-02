<script lang="ts">
	import FruitArt from '../art/FruitArt.svelte';
	import type { SpeciesCount } from '../counts.ts';
	import { i18n, monthShort, speciesName, t, tn } from '../i18n/index.svelte.ts';
	import { calendarPath } from '../site.ts';
	import { speciesById } from '../species.ts';
	import { app } from '../state.svelte.ts';
	import MonthsBar from './MonthsBar.svelte';

	let {
		counts,
		month,
		status = null
	}: {
		counts: { pickable: SpeciesCount[]; soon: SpeciesCount[]; selected: SpeciesCount | null };
		month: number;
		status?: string | null;
	} = $props();
	let expanded = $state(false);
	const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

	function pick(id: string) {
		app.selectedSpecies = app.selectedSpecies === id ? null : id;
		app.selectedTreeId = null;
	}
</script>

{#snippet row(c: SpeciesCount, soon: boolean)}
	{@const sp = speciesById(c.species)}
	{#if sp}
		<li>
			<button
				class="row"
				class:soon
				data-testid="fruit-{sp.id}"
				aria-pressed={app.selectedSpecies === sp.id}
				onclick={() => pick(sp.id)}
			>
				<FruitArt species={sp} size={46} />
				<span class="name">
					<span class="fruit">{speciesName(sp)}</span>
					<span class="meta">{tn('panel.trees', c.count)} · {t(`tier.${sp.tier}`)}</span>
				</span>
				<span class="strip"><MonthsBar species={sp} {month} /></span>
			</button>
		</li>
	{/if}
{/snippet}

<section id="season-panel" class="panel" class:expanded data-testid="season-panel" aria-labelledby="panel-title" tabindex="-1">
	<button class="handle" aria-expanded={expanded} aria-label={t('panel.title')} onclick={() => (expanded = !expanded)}>
		<span></span>
	</button>
	<div class="head">
		<h2 id="panel-title">{t('panel.title')}</h2>
		{#if app.selectedSpecies}
			<button class="clear" onclick={() => (app.selectedSpecies = null)}>{t('panel.clear')}</button>
		{/if}
	</div>
	<div class="scroll">
		<div class="months" aria-hidden="true">
			{#each MONTHS as m (m)}
				<span class:now={m === month}>{monthShort(m).slice(0, 1)}</span>
			{/each}
		</div>
		{#if counts.selected}
			<h3>{t('status.out')}</h3>
			<ul>{@render row(counts.selected, true)}</ul>
		{/if}
		{#if status}
			<p class="empty" role="status">{status}</p>
		{:else if counts.pickable.length}
			<ul>
				{#each counts.pickable as c (c.species)}{@render row(c, false)}{/each}
			</ul>
		{:else}
			<p class="empty">{t('panel.empty')}</p>
		{/if}
		{#if counts.soon.length}
			<h3>{t('panel.soon', { n: counts.soon.length })}</h3>
			<ul>
				{#each counts.soon as c (c.species)}{@render row(c, true)}{/each}
			</ul>
		{/if}
		<p class="more"><a href={calendarPath(i18n.lang)}>{t('seo.calendar_title').split(' | ')[0]}</a></p>
	</div>
</section>

<style>
	.panel {
		--strip: 120px;
		position: absolute;
		z-index: 2;
		left: 0;
		right: 0;
		bottom: 0;
		height: 40dvh;
		display: flex;
		flex-direction: column;
		background: var(--sheet);
		border-top: 1.5px solid var(--ink);
		border-radius: 14px 16px 0 0;
		box-shadow: 0 -6px 18px rgb(58 50 38 / 0.12);
		transition: height 0.25s ease;
	}
	.panel.expanded {
		height: 78dvh;
	}
	.handle {
		flex: none;
		align-self: center;
		width: 88px;
		height: 44px;
		margin-bottom: -14px;
		border: 0;
		background: none;
		padding: 0;
	}
	.handle span {
		margin: 0 auto;
	}
	.handle span {
		display: block;
		width: 42px;
		height: 4px;
		border-radius: 2px;
		background: var(--rule);
	}
	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		padding: 0 16px;
	}
	h2 {
		margin: 0;
		font-family: var(--font-hand);
		font-weight: 700;
		font-size: 1.4rem;
	}
	h3 {
		margin: 18px 16px 2px;
		font-family: var(--font-hand);
		font-weight: 400;
		font-size: 1.1rem;
		color: var(--pencil);
	}
	.clear {
		min-height: 44px;
		border: 0;
		background: none;
		font-family: var(--font-hand);
		font-size: 1rem;
		text-decoration: underline wavy;
		text-underline-offset: 4px;
	}
	.panel:focus {
		outline: none;
	}
	.scroll {
		overflow-y: auto;
		padding-bottom: env(safe-area-inset-bottom);
	}
	.months {
		display: grid;
		grid-template-columns: repeat(12, 1fr);
		width: var(--strip);
		margin: 0 16px 2px auto;
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
	.row {
		width: 100%;
		display: grid;
		grid-template-columns: 46px 1fr var(--strip);
		align-items: center;
		gap: 10px;
		padding: 6px 16px;
		border: 0;
		border-top: 1px solid var(--rule);
		background: none;
		text-align: left;
	}
	.row[aria-pressed='true'] {
		background: var(--wash);
	}
	.row.soon :global(.art) {
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
		font-size: 0.8rem;
		color: var(--pencil);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.more {
		margin: 8px 16px 16px;
		font-family: var(--font-hand);
		font-size: 1.05rem;
	}
	.more a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		color: var(--ink);
	}
	.empty {
		margin: 12px 16px;
		font-family: var(--font-hand);
		color: var(--pencil);
	}
	@media (min-width: 768px) {
		.panel,
		.panel.expanded {
			top: 76px;
			left: 16px;
			bottom: 16px;
			right: auto;
			width: 390px;
			height: auto;
			border: 1.5px solid var(--ink);
			border-radius: 12px 16px 14px 12px;
		}
		.handle {
			display: none;
		}
		.head {
			padding-top: 14px;
		}
	}
</style>
