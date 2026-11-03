<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount, tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import { version } from '../../../package.json';
	import { filtersToQuery } from '../filters.ts';
	import { i18n, t, type Lang } from '../i18n/index.svelte.ts';
	import { REPO_URL, SITE_NAME, SPONSOR_URL, homePath } from '../site.ts';
	import { currentInstallHow, install } from '../install.svelte.ts';
	import { app } from '../state.svelte.ts';
	import AboutContent from './AboutContent.svelte';
	import CalendarContent from './CalendarContent.svelte';
	import EtiquetteContent from './EtiquetteContent.svelte';
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

	// "Versão 0.1.0 (55315d5)", linking to that commit so anyone can see exactly what is running.
	const sha = __COMMIT__.slice(0, 7);
	const versionNote = $derived(t('menu.version', { v: sha ? `${version} (${sha})` : version }));
	const commitHref = __COMMIT__ ? `${REPO_URL}/commit/${__COMMIT__}` : null;

	const how = $derived(currentInstallHow());

	/** Chrome and Edge can install by themselves; elsewhere the steps are shown. */
	async function addToHome() {
		const p = install.prompt;
		if (!p) return show('install');
		await p.prompt();
		const { outcome } = await p.userChoice;
		install.prompt = null;
		if (outcome === 'accepted') install.installed = true;
	}

	const here = (path: string) => (page.url.pathname === path ? 'page' : undefined);

	type View = 'main' | 'calendar' | 'about' | 'etiquette' | 'settings' | 'install';
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
		// The menu covers the whole window: switch off everything around it for keyboards and
		// screen readers until it closes.
		const around = [...(drawer.parentElement?.children ?? [])].filter(
			(el): el is HTMLElement => el !== drawer && el instanceof HTMLElement && !el.inert
		);
		for (const el of around) el.inert = true;
		drawer.focus();
		return () => {
			for (const el of around) el.inert = false;
			document.getElementById('menu-button')?.focus();
		};
	});

	function onKey(e: KeyboardEvent) {
		if (!app.menuOpen) return;
		if (e.key === 'Escape') return onClose();
		trapTab(e, drawer);
	}
</script>

<svelte:window onkeydown={onKey} />

{#snippet inside(icon: IconName, label: string, more: boolean)}
	<Icon name={icon} />
	<span class="label">{label}</span>
	{#if more}<span class="more"><Icon name="forward" size={18} /></span>{/if}
{/snippet}

<div
	class="drawer"
	id="menu"
	role="dialog"
	aria-modal="true"
	aria-labelledby="menu-title"
	data-testid="menu"
	tabindex="-1"
	bind:this={drawer}
	transition:fly={{ x: -48, opacity: 1, duration: still ? 0 : 200 }}
	ontouchstart={(e) => (startX = e.touches[0].clientX)}
	ontouchend={(e) => {
		// Swipe left to close.
		if (startX !== null && e.changedTouches[0].clientX - startX < -60) onClose();
		startX = null;
	}}
>
	{#if view === 'main'}
		<PanelHead id="menu-title" title={SITE_NAME} note={versionNote} noteHref={commitHref} {onClose} />
		<nav aria-labelledby="menu-title">
			<ul>
				<li>
					<a class="row" href={homePath(i18n.lang)} aria-current={here(homePath(i18n.lang))}
						>{@render inside('map', t('nav.map'), false)}</a
					>
				</li>
				<li>
					<button class="row" data-view="calendar" data-testid="calendar-open" onclick={() => show('calendar')}
						>{@render inside('calendar', t('menu.calendar'), true)}</button
					>
				</li>
			</ul>
			<hr />
			<ul>
				<li>
					<button class="row" data-view="etiquette" data-testid="etiquette-open" onclick={() => show('etiquette')}
						>{@render inside('leaf', t('menu.etiquette'), true)}</button
					>
				</li>
				<li>
					<button class="row" data-view="settings" data-testid="settings-open" onclick={() => show('settings')}
						>{@render inside('settings', t('menu.settings'), true)}</button
					>
				</li>
				{#if how !== 'installed'}
					<li>
						<button class="row" data-view="install" data-testid="install-open" onclick={addToHome}
							>{@render inside('phone', t('menu.install'), how !== 'prompt')}</button
						>
					</li>
				{/if}
			</ul>
			<hr />
			<ul>
				<li>
					<a class="row" href={SPONSOR_URL} target="_blank" rel="noopener" data-testid="sponsor-open"
						>{@render inside('heart', t('about.sponsor'), false)}</a
					>
				</li>
				<li>
					<a class="row" href={mail} data-testid="feedback">{@render inside('mail', t('menu.feedback'), false)}</a>
				</li>
				<li>
					<button class="row" data-view="about" data-testid="about-open" onclick={() => show('about')}
						>{@render inside('info', t('menu.about'), true)}</button
					>
				</li>
			</ul>
		</nav>
	{:else if view === 'calendar'}
		<PanelHead id="menu-title" title={t('menu.calendar')} onBack={() => show('main')} {onClose} />
		<CalendarContent />
	{:else if view === 'install'}
		<PanelHead id="menu-title" title={t('menu.install')} onBack={() => show('main')} {onClose} />
		<div class="steps" data-testid="install-steps">
			<p>{t('install.why')}</p>
			<ol>
				{#if how === 'ios'}
					<li>{t('install.ios_1')}</li>
					<li>{t('install.ios_2')}</li>
					<li>{t('install.ios_3')}</li>
				{:else}
					<li>{t('install.browser_1')}</li>
					<li>{t('install.browser_2')}</li>
				{/if}
			</ol>
		</div>
	{:else if view === 'about'}
		<PanelHead id="menu-title" title={t('menu.about')} onBack={() => show('main')} {onClose} />
		<AboutContent />
	{:else if view === 'etiquette'}
		<PanelHead id="menu-title" title={t('menu.etiquette')} onBack={() => show('main')} {onClose} />
		<EtiquetteContent />
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
	.drawer {
		position: fixed;
		z-index: 8;
		inset: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		/* The whole window; on wide screens the content keeps a readable column. */
		padding: max(12px, env(safe-area-inset-top)) max(0px, calc((100% - 560px) / 2))
			max(14px, env(safe-area-inset-bottom));
		background: var(--sheet);
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
	.more {
		display: grid;
		margin-right: -4px;
		color: var(--pencil);
	}
	.tick {
		font-weight: 700;
	}
	hr {
		margin: 8px 20px;
		border: 0;
		border-top: 1px solid var(--rule);
	}
	.steps {
		padding: 0 20px;
	}
	.steps p {
		margin: 0 0 12px;
	}
	ol {
		margin: 0;
		padding-left: 22px;
		font-family: var(--font-hand);
		font-size: 1.2rem;
		line-height: 1.4;
	}
	ol li + li {
		margin-top: 10px;
	}
	h3 {
		margin: 4px 20px 6px;
		font-family: var(--font-hand);
		font-weight: 400;
		font-size: 1.15rem;
		color: var(--pencil);
	}
</style>
