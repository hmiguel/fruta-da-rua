<script lang="ts">
	import { page } from '$app/state';
	import { i18n, t } from '../i18n/index.svelte.ts';
	import { app } from '../state.svelte.ts';
</script>

<a class="skip" href="#season-panel">{t('nav.skip')}</a>
<header>
	<div class="brand">
		<h1>{t('app.title')}</h1>
		<span class="estimate" title={t('about.body')}>{t('app.estimate')}</span>
	</div>
	<div class="actions">
		<button
			class="check"
			data-testid="toggle-pickable"
			role="switch"
			aria-checked={app.onlyPickable}
			onclick={() => (app.onlyPickable = !app.onlyPickable)}
		>
			<span class="box" aria-hidden="true">{app.onlyPickable ? '✓' : ''}</span>
			{t('filter.onlyPickable')}
		</button>
		<a class="ghost" data-testid="lang" href={page.data.alternate} hreflang={i18n.lang === 'pt' ? 'en' : 'pt-PT'}>
			{t('lang.toggle')}
		</a>
		<button class="ghost" data-testid="about-open" aria-label={t('about.open')} onclick={() => (app.aboutOpen = true)}>
			?
		</button>
	</div>
</header>

<style>
	header {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 3;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 4px 10px;
		padding: max(8px, env(safe-area-inset-top)) 12px 12px;
		background: linear-gradient(var(--paper) 65%, transparent);
		pointer-events: none;
	}
	header > * {
		pointer-events: auto;
	}
	.brand {
		display: flex;
		align-items: baseline;
		gap: 10px;
	}
	h1 {
		margin: 0;
		font-family: var(--font-hand);
		font-weight: 700;
		font-size: 1.7rem;
		line-height: 1.2;
	}
	.estimate {
		font-family: var(--font-text);
		font-style: italic;
		font-size: 0.85rem;
		color: var(--pencil);
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 4px;
	}
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
	.check {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 44px;
		padding: 0 10px 0 4px;
		border: 0;
		background: none;
		font-family: var(--font-hand);
		font-size: 1.05rem;
	}
	.box {
		display: grid;
		place-items: center;
		width: 20px;
		height: 20px;
		border: 1.5px solid var(--ink);
		border-radius: 3px 5px 4px 3px;
		background: var(--sheet);
		font-weight: 700;
		line-height: 1;
	}
	.ghost {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		height: 44px;
		padding: 0 10px;
		color: var(--ink);
		text-decoration: none;
		border: 1.5px solid var(--ink);
		border-radius: 48% 52% 50% 46%;
		background: var(--sheet);
		font-family: var(--font-hand);
		font-size: 1rem;
		font-weight: 700;
	}
</style>
