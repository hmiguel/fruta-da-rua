<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Icon, { type IconName } from './Icon.svelte';

	/** The one round 44px button for menu, close and back, the same in every panel. */
	let { icon, label, ...rest }: { icon: IconName; label: string } & HTMLButtonAttributes = $props();
</script>

<button class="icon-button" type="button" aria-label={label} {...rest}><Icon name={icon} /></button>

<style>
	.icon-button {
		flex: none;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: none;
		color: var(--ink);
	}
	.icon-button:active {
		background: var(--wash);
	}
</style>
