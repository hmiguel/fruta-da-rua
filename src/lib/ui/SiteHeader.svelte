<script lang="ts">
	import { page } from '$app/state';
	import { i18n, t } from '../i18n/index.svelte.ts';
	import { calendarPath, homePath } from '../site.ts';
</script>

<a class="skip" href="#main">{t('nav.skip_content')}</a>
<header>
	<a class="brand" href={homePath(i18n.lang)}>{t('app.title')}</a>
	<nav aria-label={t('app.title')}>
		<a href={homePath(i18n.lang)}>{t('nav.map')}</a>
		<a href={calendarPath(i18n.lang)} aria-current={page.url.pathname === calendarPath(i18n.lang) ? 'page' : undefined}
			>{t('nav.calendar')}</a
		>
		<a class="lang" href={page.data.alternate} hreflang={i18n.lang === 'pt' ? 'en' : 'pt-PT'} data-testid="lang"
			>{t('lang.toggle')}</a
		>
	</nav>
</header>

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
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 4px 12px;
		max-width: 760px;
		margin: 0 auto;
		padding: max(6px, env(safe-area-inset-top)) 16px 6px;
	}
	.brand {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		font-family: var(--font-hand);
		font-weight: 700;
		font-size: 1.6rem;
		color: var(--ink);
		text-decoration: none;
	}
	nav {
		display: flex;
		gap: 2px;
	}
	nav a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
		padding: 0 10px;
		font-family: var(--font-hand);
		font-size: 1.1rem;
		color: var(--ink);
		text-underline-offset: 5px;
	}
	nav a[aria-current='page'] {
		text-decoration: underline wavy;
	}
	.lang {
		font-weight: 700;
	}
</style>
