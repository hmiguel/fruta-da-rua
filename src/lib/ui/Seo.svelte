<script lang="ts">
	import { page } from '$app/state';
	import { htmlLang, i18n } from '../i18n/index.svelte.ts';
	import { SITE_NAME, absoluteUrl } from '../site.ts';

	let {
		title,
		description,
		image = '/og/home.png',
		jsonLd = []
	}: { title: string; description: string; image?: string; jsonLd?: object[] } = $props();

	const path = $derived(page.url.pathname);
	const alternate = $derived(page.data.alternate as string);
	const ptPath = $derived(i18n.lang === 'pt' ? path : alternate);
	const enPath = $derived(i18n.lang === 'en' ? path : alternate);

	// JSON inside <script> must not be able to close the tag.
	const ld = $derived(
		jsonLd.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</` + 'script>')
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={absoluteUrl(path)} />
	<link rel="alternate" hreflang="pt-PT" href={absoluteUrl(ptPath)} />
	<link rel="alternate" hreflang="en" href={absoluteUrl(enPath)} />
	<link rel="alternate" hreflang="x-default" href={absoluteUrl(ptPath)} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={absoluteUrl(path)} />
	<meta property="og:image" content={absoluteUrl(image)} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:locale" content={htmlLang(i18n.lang).replace('-', '_')} />
	<meta name="twitter:card" content="summary_large_image" />
	{#each ld as script, i (i)}
		{@html script}
	{/each}
</svelte:head>
