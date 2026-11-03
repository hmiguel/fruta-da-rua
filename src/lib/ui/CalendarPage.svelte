<script lang="ts">
	import { i18n, speciesName, t } from '../i18n/index.svelte.ts';
	import { EDIBLE, absoluteUrl, calendarPath, fruitPath, homePath } from '../site.ts';
	import CalendarContent from './CalendarContent.svelte';
	import Seo from './Seo.svelte';
	import SiteFooter from './SiteFooter.svelte';
	import SiteHeader from './SiteHeader.svelte';

	// In harvest order through the year, starting with what ripens first.
	const fruits = $derived(
		[...EDIBLE].sort((a, b) => a.ripe[0] - b.ripe[0] || speciesName(a).localeCompare(speciesName(b), 'pt'))
	);
</script>

<Seo
	title={t('seo.calendar_title')}
	description={t('seo.calendar_description')}
	jsonLd={[
		{
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: t('crumb.home'), item: absoluteUrl(homePath(i18n.lang)) },
				{ '@type': 'ListItem', position: 2, name: t('crumb.calendar'), item: absoluteUrl(calendarPath(i18n.lang)) }
			]
		},
		{
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			itemListElement: fruits.map((s, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: speciesName(s),
				url: absoluteUrl(fruitPath(s, i18n.lang))
			}))
		}
	]}
/>

<SiteHeader />

<main id="main" tabindex="-1">
	<h1>{t('calendar.title')}</h1>
	<CalendarContent />
</main>

<SiteFooter />

<style>
	main {
		max-width: 760px;
		margin: 0 auto;
		padding: 0 0 24px;
	}
	main:focus {
		outline: none;
	}
	h1 {
		margin: 8px 20px 10px;
		font-family: var(--font-hand);
		font-weight: 700;
		font-size: 2.1rem;
		line-height: 1.15;
	}
</style>
