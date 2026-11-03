<script lang="ts">
	import { page } from '$app/state';
	import { onMount, tick } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { version } from '../../../package.json';
	import { filtersToQuery } from '../filters.ts';
	import { i18n, t, type Lang } from '../i18n/index.svelte.ts';
	import { SITE_NAME, calendarPath } from '../site.ts';
	import { app, topLayer } from '../state.svelte.ts';
	import { trapTab } from './trap.ts';

	const FEEDBACK = 'hugo@lixo.dev';
	let { onClose }: { onClose: () => void } = $props();
	let drawer: HTMLDivElement;
	let startX: number | null = null;

	const still = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const mail = $derived(`mailto:${FEEDBACK}?subject=${encodeURIComponent(t('menu.feedback_subject'))}`);

	const LANGS: { id: Lang; name: string; html: string }[] = [
		{ id: 'pt', name: 'Português', html: 'pt-PT' },
		{ id: 'en', name: 'English', html: 'en' }
	];
	/** The same map in the other language keeps the chosen filters. */
	const langHref = (l: Lang) =>
		(l === i18n.lang ? page.url.pathname : page.data.alternate) + filtersToQuery(app.filters, l);

	let view = $state<'main' | 'settings'>('main');
	async function show(v: 'main' | 'settings') {
		view = v;
		await tick();
		drawer.querySelector<HTMLElement>(v === 'settings' ? '.back' : '[data-testid=settings-open]')?.focus();
	}

	onMount(() => {
		drawer.focus();
		// When About replaced the menu, About owns focus now.
		return () => !app.aboutOpen && document.getElementById('menu-button')?.focus();
	});

	function onKey(e: KeyboardEvent) {
		if (topLayer() !== 'menu') return;
		if (e.key === 'Escape') return onClose();
		trapTab(e, drawer);
	}

	function openAbout() {
		onClose();
		app.aboutOpen = true;
	}
</script>

<svelte:window onkeydown={onKey} />

<div class="scrim" role="presentation" onclick={onClose} transition:fade={{ duration: still ? 0 : 200 }}></div>
<div
	class="drawer"
	id="menu"
	role="dialog"
	aria-modal="true"
	aria-labelledby="menu-title"
	data-testid="menu"
	tabindex="-1"
	bind:this={drawer}
	transition:fly={{ x: -300, opacity: 1, duration: still ? 0 : 220 }}
	ontouchstart={(e) => (startX = e.touches[0].clientX)}
	ontouchend={(e) => {
		// Swipe left to close.
		if (startX !== null && e.changedTouches[0].clientX - startX < -60) onClose();
		startX = null;
	}}
>
	{#if view === 'main'}
		<div class="head">
			<div>
				<h2 id="menu-title">{SITE_NAME}</h2>
				<p class="version">{t('menu.version', { v: version })}</p>
			</div>
			<button class="close" aria-label={t('menu.close')} onclick={onClose}>×</button>
		</div>
		<nav aria-labelledby="menu-title">
			<ul>
				<li><a href={calendarPath(i18n.lang)}>{t('menu.calendar')}</a></li>
				<li><button data-testid="about-open" onclick={openAbout}>{t('menu.about')}</button></li>
			</ul>
			<hr />
			<ul>
				<li><a href={mail} data-testid="feedback">{t('menu.feedback')}</a></li>
				<li>
					<button data-testid="settings-open" onclick={() => show('settings')}>
						<span>{t('menu.settings')}</span>
						<span class="hint">{LANGS.find((l) => l.id === i18n.lang)?.name}</span>
					</button>
				</li>
			</ul>
		</nav>
	{:else}
		<div class="head">
			<button class="back" aria-label={t('menu.back')} data-testid="settings-back" onclick={() => show('main')}>
				<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
					<path d="M15 5.2c-2.6 2.2-4.9 4.4-7 6.9 2.2 2.3 4.5 4.6 7.1 6.8" />
				</svg>
			</button>
			<h2 id="menu-title" class="sub">{t('menu.settings')}</h2>
			<button class="close" aria-label={t('menu.close')} onclick={onClose}>×</button>
		</div>
		<section aria-labelledby="lang-title">
			<h3 id="lang-title">{t('settings.language')}</h3>
			<ul>
				{#each LANGS as l (l.id)}
					<li>
						<a
							href={langHref(l.id)}
							hreflang={l.html}
							lang={l.html}
							aria-current={l.id === i18n.lang ? 'true' : undefined}
							data-testid="lang-{l.id}"
						>
							<span>{l.name}</span>
							<span class="tick" aria-hidden="true">{l.id === i18n.lang ? '✓' : ''}</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

<style>
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 7;
		background: rgb(58 50 38 / 0.35);
	}
	.drawer {
		position: fixed;
		z-index: 8;
		top: 0;
		bottom: 0;
		left: 0;
		width: min(290px, 85vw);
		overflow-y: auto;
		padding: max(14px, env(safe-area-inset-top)) 0 max(14px, env(safe-area-inset-bottom));
		background: var(--sheet);
		border-right: 1.5px solid var(--ink);
		border-radius: 0 16px 14px 0;
		box-shadow: 6px 0 20px rgb(58 50 38 / 0.2);
	}
	.drawer:focus {
		outline: none;
	}
	.head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 0 6px 10px 20px;
	}
	.head:has(.back) {
		align-items: center;
		padding-left: 8px;
	}
	h2 {
		margin: 0;
		font-family: var(--font-hand);
		font-weight: 700;
		font-size: 1.7rem;
		line-height: 1.2;
	}
	.version {
		margin: 0;
		font-size: 0.85rem;
		color: var(--pencil);
	}
	.close,
	.back {
		flex: none;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: 0;
		background: none;
		font-family: var(--font-hand);
		font-size: 1.8rem;
		line-height: 1;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.back path {
		fill: none;
		stroke: var(--ink);
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.sub {
		flex: 1;
		align-self: center;
		font-size: 1.5rem;
	}
	h3 {
		margin: 6px 20px 4px;
		font-family: var(--font-hand);
		font-weight: 400;
		font-size: 1.1rem;
		color: var(--pencil);
	}
	.hint {
		margin-left: auto;
		font-family: var(--font-text);
		font-size: 0.9rem;
		color: var(--pencil);
	}
	.tick {
		margin-left: auto;
		font-weight: 700;
	}
	a[aria-current='true'] {
		background: var(--wash);
	}
	a,
	button:not(.close, .back) {
		display: flex;
		align-items: center;
		width: 100%;
		min-height: 52px;
		padding: 0 20px;
		border: 0;
		background: none;
		color: var(--ink);
		font-family: var(--font-hand);
		font-size: 1.25rem;
		text-align: left;
		text-decoration: none;
	}
	a:active,
	button:not(.close, .back):active {
		background: var(--wash);
	}
	hr {
		margin: 8px 20px;
		border: 0;
		border-top: 1px solid var(--rule);
	}
</style>
