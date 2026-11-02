<script lang="ts">
	import { t } from '$lib/i18n/index.svelte.ts';
	import { SITE_NAME, SITE_URL } from '$lib/site.ts';
	import MapApp from '$lib/ui/MapApp.svelte';
	import Seo from '$lib/ui/Seo.svelte';
	import { i18n } from '$lib/i18n/index.svelte.ts';
</script>

<Seo
	title={t('seo.home_title')}
	description={t('seo.home_description')}
	jsonLd={[
		{
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: SITE_NAME,
			url: SITE_URL,
			inLanguage: i18n.lang === 'en' ? 'en' : 'pt-PT',
			description: t('seo.home_description')
		}
	]}
/>
<MapApp />
