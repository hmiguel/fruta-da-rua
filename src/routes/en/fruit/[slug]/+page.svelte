<script lang="ts">
	import FruitPage from '$lib/ui/FruitPage.svelte';

	let { data } = $props();
</script>

<FruitPage speciesId={data.speciesId} stats={data.stats} />
