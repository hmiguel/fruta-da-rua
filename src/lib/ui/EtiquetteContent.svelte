<script lang="ts">
	import { t } from '../i18n/index.svelte.ts';
</script>

<div class="etiquette" data-testid="etiquette">
	<p class="rule">{t('sheet.etiquette')}</p>
	<h3>{t('etiquette.law_title')}</h3>
	<p>{t('about.rules')}</p>
</div>

<style>
	.etiquette {
		padding: 0 20px 8px;
	}
	p {
		margin: 0;
	}
	.rule {
		padding: 2px 0 2px 14px;
		border-left: 2px solid var(--ink);
		font-family: var(--font-hand);
		font-size: 1.15rem;
		line-height: 1.45;
	}
	h3 {
		margin: 20px 0 6px;
		font-family: var(--font-hand);
		font-weight: 400;
		font-size: 1.15rem;
		color: var(--pencil);
	}
</style>
