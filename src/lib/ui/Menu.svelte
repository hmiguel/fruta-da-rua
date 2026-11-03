<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { version } from '../../../package.json';
	import { i18n, t } from '../i18n/index.svelte.ts';
	import { SITE_NAME, calendarPath } from '../site.ts';
	import { app, topLayer } from '../state.svelte.ts';
	import { trapTab } from './trap.ts';

	const FEEDBACK = 'hugo@lixo.dev';
	let { onClose }: { onClose: () => void } = $props();
	let drawer: HTMLDivElement;
	let startX: number | null = null;

	const still = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const mail = $derived(`mailto:${FEEDBACK}?subject=${encodeURIComponent(t('menu.feedback_subject'))}`);

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
				<a
					href={page.data.alternate}
					hreflang={i18n.lang === 'pt' ? 'en' : 'pt-PT'}
					lang={i18n.lang === 'pt' ? 'en' : 'pt-PT'}
					data-testid="lang">{t('lang.name')}</a
				>
			</li>
		</ul>
	</nav>
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
	.close {
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
	a,
	button:not(.close) {
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
	button:not(.close):active {
		background: var(--wash);
	}
	hr {
		margin: 8px 20px;
		border: 0;
		border-top: 1px solid var(--rule);
	}
</style>
