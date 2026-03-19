<script lang="ts">
	import { balanceStore } from '$lib/stores/balance.svelte';

	let { show = false }: { show?: boolean } = $props();

	let formatted = $derived(
		balanceStore.balance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
	);
</script>

<div class="mini-bal" class:show>
	<span class="mb-logo">yo</span>
	<span class="mb-val"><span class="mini-sym">$</span><span>{formatted}</span></span>
	<span class="mb-rate">+{balanceStore.rateDisplay}/s</span>
</div>

<style>
	.mini-bal {
		position: fixed;
		top: 0;
		left: 50%;
		transform: translateX(-50%) translateY(-100%);
		width: 100%;
		max-width: 430px;
		padding: calc(12px + env(safe-area-inset-top)) 20px 12px;
		background: rgba(5, 5, 7, 0.92);
		backdrop-filter: blur(40px);
		-webkit-backdrop-filter: blur(40px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
		z-index: 150;
		display: flex;
		justify-content: space-between;
		align-items: center;
		opacity: 0;
		pointer-events: none;
		transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.mini-bal.show {
		opacity: 1;
		pointer-events: auto;
		transform: translateX(-50%) translateY(0);
	}
	.mb-logo {
		font-family: var(--font-serif);
		font-style: italic;
		font-size: 16px;
		color: var(--text-dim);
	}
	.mb-val {
		font-family: var(--font-mono);
		font-size: 20px;
		font-weight: 400;
		letter-spacing: -1px;
	}
	.mini-sym {
		font-size: 13px;
		color: var(--text-secondary);
	}
	.mb-rate {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--green);
	}
</style>
