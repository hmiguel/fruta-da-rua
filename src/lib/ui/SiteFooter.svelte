<script lang="ts">
	import { t } from '../i18n/index.svelte.ts';
</script>

<footer>
	<p>{t('about.rules')}</p>
	<p>{t('about.credit')}</p>
</footer>

<style>
	footer {
		max-width: 760px;
		margin: 16px auto 0;
		padding: 16px 16px max(24px, env(safe-area-inset-bottom));
		border-top: 1px solid var(--rule);
		font-size: 0.85rem;
		color: var(--pencil);
	}
	p {
		margin: 0 0 8px;
	}
</style>
