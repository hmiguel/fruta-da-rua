<script lang="ts">
	import '@fontsource/kalam/400.css';
	import '@fontsource/kalam/700.css';
	import '@fontsource/spectral/400.css';
	import '@fontsource/spectral/400-italic.css';
	import '@fontsource/spectral/600.css';
	import { onMount } from 'svelte';
	import { i18n, setLang } from '$lib/i18n/index.svelte.ts';
	import { listenForInstall } from '$lib/install.svelte.ts';
	import '../app.css';
	import kalamBold from '@fontsource/kalam/files/kalam-latin-700-normal.woff2?url';
	import kalam from '@fontsource/kalam/files/kalam-latin-400-normal.woff2?url';
	import spectral from '@fontsource/spectral/files/spectral-latin-400-normal.woff2?url';

	let { data, children } = $props();

	// Set during render too, so prerendered HTML is in the page's language.
	// svelte-ignore state_referenced_locally
	i18n.lang = data.lang;
	$effect.pre(() => setLang(data.lang));
	onMount(listenForInstall);
</script>

<svelte:head>
	<!-- Fetch the fonts with the page so text doesn't jump when they arrive. -->
	{#each [kalamBold, kalam, spectral] as href (href)}
		<link rel="preload" as="font" type="font/woff2" crossorigin="anonymous" {href} />
	{/each}
</svelte:head>

{@render children()}
