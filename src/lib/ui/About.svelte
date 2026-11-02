<script lang="ts">
	import { onMount } from 'svelte';
	import { i18n, t } from '../i18n/index.svelte.ts';
	import { calendarPath } from '../site.ts';

	let { onClose }: { onClose: () => void } = $props();
	let generatedAt: string | null = $state(null);
	let dialog: HTMLDivElement;

	const dataDate = $derived(
		generatedAt
			? new Date(generatedAt).toLocaleDateString(i18n.lang === 'en' ? 'en-GB' : 'pt-PT', { dateStyle: 'long' })
			: null
	);

	/** Keep Tab inside the dialog while it is open. */
	function trap(e: KeyboardEvent) {
		if (e.key === 'Escape') return onClose();
		if (e.key !== 'Tab') return;
		const items = [...dialog.querySelectorAll<HTMLElement>('a[href], button')];
		const first = items[0];
		const last = items[items.length - 1];
		if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}

	onMount(() => {
		const opener = document.activeElement as HTMLElement | null;
		dialog.focus();
		fetch('/meta.json')
			.then((r) => r.json())
			.then((m) => (generatedAt = m.generated_at))
			.catch(() => {});
		return () => opener?.focus?.();
	});
</script>

<svelte:window onkeydown={trap} />

<div class="scrim" role="presentation" onclick={onClose}></div>
<div class="about" role="dialog" aria-modal="true" aria-labelledby="about-title" data-testid="about" tabindex="-1" bind:this={dialog}>
	<button class="close" aria-label={t('about.close')} onclick={onClose}>×</button>
	<h2 id="about-title">{t('about.title')}</h2>
	<p>{t('about.body')}</p>

	<h3>{t('about.etiquette_title')}</h3>
	<p class="etiquette">{t('sheet.etiquette')}</p>
	<p class="rules">{t('about.rules')}</p>

	<p class="credit">
		{t('about.credit')}
		{#if dataDate}<br />{t('about.data_date', { date: dataDate })}{/if}
	</p>

	<p class="calendar"><a href={calendarPath(i18n.lang)}>{t('seo.calendar_title').split(' | ')[0]}</a></p>

	<h3>{t('about.related')}</h3>
	<ul>
		<li><a href="https://fallingfruit.org" target="_blank" rel="noopener">Falling Fruit</a></li>
		<li>Muita Fruta (Cozinha Popular da Mouraria)</li>
	</ul>
</div>

<style>
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 9;
		background: rgb(58 50 38 / 0.3);
	}
	.about {
		position: fixed;
		z-index: 10;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: min(440px, calc(100vw - 32px));
		max-height: calc(100dvh - 48px);
		overflow-y: auto;
		padding: 22px 22px;
		background: var(--sheet);
		border: 1.5px solid var(--ink);
		border-radius: 12px 16px 14px 12px;
		box-shadow: 0 10px 30px rgb(58 50 38 / 0.25);
	}
	.about:focus {
		outline: none;
	}
	.close {
		position: absolute;
		top: 6px;
		right: 6px;
		width: 44px;
		height: 44px;
		border: 0;
		background: none;
		font-family: var(--font-hand);
		font-size: 1.8rem;
		line-height: 1;
	}
	h2 {
		margin: 0 40px 10px 0;
		font-family: var(--font-hand);
		font-weight: 700;
		font-size: 1.7rem;
		line-height: 1.2;
	}
	h3 {
		margin: 18px 0 6px;
		font-family: var(--font-hand);
		font-weight: 400;
		font-size: 1.2rem;
	}
	p {
		margin: 0;
	}
	.etiquette {
		padding: 2px 0 2px 14px;
		border-left: 2px solid var(--ink);
		font-family: var(--font-hand);
		font-size: 1.05rem;
		color: var(--pencil);
	}
	.rules {
		margin-top: 10px;
		font-size: 0.9rem;
	}
	.credit {
		margin-top: 16px;
		font-size: 0.85rem;
		color: var(--pencil);
	}
	.calendar {
		margin-top: 14px;
		font-family: var(--font-hand);
		font-size: 1.1rem;
	}
	.calendar a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
	}
	ul {
		margin: 0;
		padding-left: 18px;
	}
	a {
		color: var(--ink);
	}
</style>
