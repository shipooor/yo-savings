<script lang="ts">
	import { onMount } from 'svelte';
	import TabNav from '$lib/components/TabNav.svelte';
	import BalanceTab from '$lib/components/balance/BalanceTab.svelte';
	import VaultsTab from '$lib/components/vaults/VaultsTab.svelte';
	import ProgressTab from '$lib/components/progress/ProgressTab.svelte';
	import HistoryTab from '$lib/components/history/HistoryTab.svelte';
	import MiniBal from '$lib/components/MiniBal.svelte';
	import Canvas from '$lib/components/balance/Canvas.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import Confetti from '$lib/components/Confetti.svelte';
	import { balanceStore } from '$lib/stores/balance.svelte';

	let activeTab = $state<'balance' | 'vaults' | 'progress' | 'history'>('balance');

	// Ticker runs globally so MiniBal stays live on all tabs
	onMount(() => {
		balanceStore.startTicker();
		return () => balanceStore.stopTicker();
	});
</script>

<Canvas visible={activeTab === 'balance'} />

<MiniBal show={activeTab !== 'balance'} />

<div class="tab-panel" class:active={activeTab === 'balance'} class:no-scroll={activeTab === 'balance'}>
	<BalanceTab visible={activeTab === 'balance'} />
</div>
<div class="tab-panel" class:active={activeTab === 'vaults'}>
	<VaultsTab />
</div>
<div class="tab-panel" class:active={activeTab === 'progress'}>
	<ProgressTab />
</div>
<div class="tab-panel" class:active={activeTab === 'history'}>
	<HistoryTab />
</div>

<TabNav bind:activeTab />

<Toast />
<Confetti />

<style>
	.tab-panel {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
		transform: translateY(12px);
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
	}
	.tab-panel.active {
		opacity: 1;
		pointer-events: auto;
		transform: translateY(0);
	}
	.tab-panel.no-scroll {
		overflow: hidden;
	}
</style>
