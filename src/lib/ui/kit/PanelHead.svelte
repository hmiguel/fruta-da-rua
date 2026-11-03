<script lang="ts">
	import { t } from '../../i18n/index.svelte.ts';
	import IconButton from './IconButton.svelte';

	/** Title row shared by every panel: optional back, the title, close on the right. */
	let {
		id,
		title,
		note = null,
		onBack = null,
		onClose
	}: { id: string; title: string; note?: string | null; onBack?: (() => void) | null; onClose: () => void } = $props();
</script>

<div class="head" class:sub={onBack}>
	{#if onBack}
		<IconButton icon="back" label={t('menu.back')} data-testid="panel-back" onclick={onBack} />
	{/if}
	<div class="titles">
		<h2 {id}>{title}</h2>
		{#if note}<p>{note}</p>{/if}
	</div>
	<IconButton icon="close" label={t('panel.close')} data-testid="panel-close" onclick={onClose} />
</div>

<style>
	.head {
		display: flex;
		align-items: flex-start;
		gap: 4px;
		padding: 0 6px 8px 20px;
	}
	.head.sub {
		padding-left: 8px;
	}
	.titles {
		flex: 1;
		min-width: 0;
		padding-top: 4px;
	}
	h2 {
		margin: 0;
		font-family: var(--font-hand);
		font-weight: 700;
		font-size: 1.55rem;
		line-height: 1.25;
	}
	p {
		margin: 0;
		font-size: 0.85rem;
		color: var(--pencil);
	}
</style>
