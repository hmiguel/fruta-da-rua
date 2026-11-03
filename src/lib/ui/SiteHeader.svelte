<script lang="ts">
	import { i18n, t } from '../i18n/index.svelte.ts';
	import { homePath } from '../site.ts';
	import { app } from '../state.svelte.ts';
	import IconButton from './kit/IconButton.svelte';
	import Menu from './Menu.svelte';
</script>

<a class="skip" href="#main">{t('nav.skip_content')}</a>
<header>
	<div class="bar paper-bar">
		<IconButton
			id="menu-button"
			icon="menu"
			label={t('menu.open')}
			aria-expanded={app.menuOpen}
			aria-controls={app.menuOpen ? 'menu' : undefined}
			data-testid="menu-open"
			onclick={() => (app.menuOpen = true)}
		/>
		<a class="brand" href={homePath(i18n.lang)}>{t('app.title')}</a>
	</div>
</header>
{#if app.menuOpen}
	<Menu onClose={() => (app.menuOpen = false)} />
{/if}

<style>
	.skip {
		position: absolute;
		left: 8px;
		top: -60px;
		z-index: 20;
		padding: 10px 14px;
		background: var(--sheet);
		border: 1.5px solid var(--ink);
		border-radius: 8px;
		color: var(--ink);
	}
	.skip:focus {
		top: 8px;
	}
	header {
		position: sticky;
		top: 0;
		z-index: 5;
		max-width: 760px;
		margin: 0 auto;
		padding: max(10px, env(safe-area-inset-top)) 12px 10px;
		background: linear-gradient(var(--paper) 70%, transparent);
	}
	.brand {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 0 6px;
		font-family: var(--font-hand);
		font-weight: 700;
		font-size: 1.35rem;
		color: var(--ink);
		text-decoration: none;
	}
</style>
