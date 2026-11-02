<script lang="ts">
	import type { Species } from '../types.ts';

	// Pre-rendered by scripts/make-art.ts; drawing the watercolour filters live is too slow on phones.
	let { species, size = 48, eager = false }: { species: Species; size?: number; eager?: boolean } = $props();
</script>

<img
	class="art"
	src="/art/{size > 48 ? 'lg' : 'sm'}/{species.id}.webp"
	width={size}
	height={size}
	alt=""
	loading={eager ? 'eager' : 'lazy'}
	decoding="async"
/>

<style>
	.art {
		display: block;
		flex: none;
	}
</style>
