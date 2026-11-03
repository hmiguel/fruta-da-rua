<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount, tick } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { version } from '../../../package.json';
	import { filtersToQuery } from '../filters.ts';
	import { i18n, t, type Lang } from '../i18n/index.svelte.ts';
	import { SITE_NAME, calendarPath, homePath } from '../site.ts';
	import { app } from '../state.svelte.ts';
	import AboutContent from './AboutContent.svelte';
	import Icon, { type IconName } from './kit/Icon.svelte';
	import PanelHead from './kit/PanelHead.svelte';
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
	/** The same page in the other language, keeping the map's filters. */
	const langHref = (l: Lang) =>
		(l === i18n.lang ? page.url.pathname : page.data.alternate) +
		(page.url.pathname === homePath(i18n.lang) ? filtersToQuery(app.filters, l) : '');

	const here = (path: string) => (page.url.pathname === path ? 'page' : undefined);

	type View = 'main' | 'about' | 'settings';
	let view = $state<View>('main');

	/** Sub-views open in place; focus goes to their back button, and back to the row that opened them. */
	async function show(v: View) {
		const previous = view;
		view = v;
		await tick();
		const target = v === 'main' ? `[data-view=${previous}]` : '[data-testid=panel-back]';
		drawer.querySelector<HTMLElement>(target)?.focus();
	}

	// Links in the menu change page without reloading it: close on the way out.
	beforeNavigate(() => onClose());

	onMount(() => {
		drawer.focus();
		return () => document.getElementById('menu-button')?.focus();
	});

	function onKey(e: KeyboardEvent) {
		if (!app.menuOpen) return;
		if (e.key === 'Escape') return onClose();
		trapTab(e, drawer);
	}
</script>

<svelte:window onkeydown={onKey} />

{#snippet inside(icon: IconName, label: string, trail: string | null, more: boolean)}
	<Icon name={icon} />
	<span class="label">{label}</span>
	{#if trail}<span class="trail">{trail}</span>{/if}
	{#if more}<span class="more"><Icon name="forward" size={18} /></span>{/if}
{/snippet}

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
		<PanelHead id="menu-title" title={SITE_NAME} note={t('menu.version', { v: version })} {onClose} />
		<nav aria-labelledby="menu-title">
			<ul>
				<li>
					<a class="row" href={homePath(i18n.lang)} aria-current={here(homePath(i18n.lang))}
						>{@render inside('map', t('nav.map'), null, false)}</a
					>
				</li>
				<li>
					<a class="row" href={calendarPath(i18n.lang)} aria-current={here(calendarPath(i18n.lang))}
						>{@render inside('calendar', t('menu.calendar'), null, false)}</a
					>
				</li>
			</ul>
			<hr />
			<ul>
				<li>
					<button class="row" data-view="about" data-testid="about-open" onclick={() => show('about')}
						>{@render inside('info', t('menu.about'), null, true)}</button
					>
				</li>
				<li>
					<button class="row" data-view="settings" data-testid="settings-open" onclick={() => show('settings')}
						>{@render inside('settings', t('menu.settings'), LANGS.find((l) => l.id === i18n.lang)!.name, true)}</button
					>
				</li>
			</ul>
			<hr />
			<ul>
				<li>
					<a class="row" href={mail} data-testid="feedback">{@render inside('mail', t('menu.feedback'), null, false)}</a
					>
					<p class="hint">{t('menu.feedback_hint')}</p>
				</li>
			</ul>
		</nav>
	{:else if view === 'about'}
		<PanelHead id="menu-title" title={t('menu.about')} onBack={() => show('main')} {onClose} />
		<AboutContent />
	{:else}
		<PanelHead id="menu-title" title={t('menu.settings')} onBack={() => show('main')} {onClose} />
		<section aria-labelledby="lang-title">
			<h3 id="lang-title">{t('settings.language')}</h3>
			<ul>
				{#each LANGS as l (l.id)}
					<li>
						<a
							class="row"
							href={langHref(l.id)}
							hreflang={l.html}
							lang={l.html}
							aria-current={l.id === i18n.lang ? 'true' : undefined}
							data-testid="lang-{l.id}"
						>
							<span class="label">{l.name}</span>
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
		width: min(320px, 86vw);
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: max(12px, env(safe-area-inset-top)) 0 max(14px, env(safe-area-inset-bottom));
		background: var(--sheet);
		border-right: 1.5px solid var(--ink);
		border-radius: 0 16px 14px 0;
		box-shadow: 6px 0 20px rgb(58 50 38 / 0.2);
	}
	.drawer:focus {
		outline: none;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	/* Every choice in the menu is this row; where you are gets the green wash. */
	.row {
		display: flex;
		align-items: center;
		gap: 14px;
		width: calc(100% - 16px);
		min-height: 52px;
		margin: 1px 8px;
		padding: 0 12px;
		border: 0;
		border-radius: 12px 14px 12px 13px;
		background: none;
		color: var(--ink);
		font-family: var(--font-hand);
		font-size: 1.2rem;
		text-align: left;
		text-decoration: none;
	}
	.row:active,
	.row[aria-current] {
		background: var(--wash);
	}
	.label {
		flex: 1;
	}
	.trail {
		font-family: var(--font-text);
		font-size: 0.9rem;
		color: var(--pencil);
	}
	.more {
		display: grid;
		margin-right: -4px;
		color: var(--pencil);
	}
	.tick {
		font-weight: 700;
	}
	.hint {
		margin: -8px 20px 4px 56px;
		font-size: 0.85rem;
		color: var(--pencil);
	}
	hr {
		margin: 8px 20px;
		border: 0;
		border-top: 1px solid var(--rule);
	}
	h3 {
		margin: 4px 20px 6px;
		font-family: var(--font-hand);
		font-weight: 400;
		font-size: 1.15rem;
		color: var(--pencil);
	}
</style>
