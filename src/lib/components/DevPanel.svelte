<script lang="ts">
	import { balanceStore } from '$lib/stores/balance.svelte';

	let sliderValue = $state(Math.log10(balanceStore.eps));

	const presets = [
		{ label: '$10K', eps: 0.0041 },
		{ label: '$100K', eps: 0.041 },
		{ label: '$1M', eps: 0.41 },
		{ label: '$10M', eps: 4.1 }
	];

	function handleSlider(e: Event) {
		const val = parseFloat((e.target as HTMLInputElement).value);
		sliderValue = val;
		balanceStore.setEps(Math.pow(10, val));
	}

	function handlePreset(eps: number) {
		balanceStore.setEps(eps);
		sliderValue = Math.log10(eps);
	}

	let display = $derived(
		balanceStore.eps >= 1 ? '$' + balanceStore.eps.toFixed(1) : '$' + balanceStore.eps.toFixed(4)
	);
</script>

<div class="dev">
	<div class="dev-title">Dev Panel</div>
	<div class="dev-row"><span>$/sec</span><span class="dev-val">{display}</span></div>
	<input class="dev-slider" type="range" min="-3" max="2" step="0.1" value={sliderValue} oninput={handleSlider}>
	<div class="dev-presets">
		{#each presets as p}
			<button
				class="dev-pre"
				class:on={Math.abs(p.eps - balanceStore.eps) < balanceStore.eps * 0.1}
				onclick={() => handlePreset(p.eps)}
			>{p.label}</button>
		{/each}
	</div>
</div>

<style>
	.dev {
		position: fixed;
		bottom: 80px;
		left: 12px;
		z-index: 500;
		background: rgba(0, 0, 0, 0.85);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		padding: 10px 12px;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-secondary);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 180px;
	}
	.dev-title {
		font-size: 9px;
		color: var(--text-dim);
		letter-spacing: 2px;
		text-transform: uppercase;
	}
	.dev-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.dev-val {
		color: var(--gold);
		font-size: 12px;
	}
	.dev-slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 3px;
		background: var(--border);
		border-radius: 2px;
		outline: none;
	}
	.dev-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--gold);
		cursor: pointer;
		border: 2px solid var(--bg);
		box-shadow: 0 0 6px rgba(200, 164, 78, 0.3);
	}
	.dev-presets {
		display: flex;
		gap: 4px;
	}
	.dev-pre {
		flex: 1;
		padding: 4px;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: transparent;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 9px;
		cursor: pointer;
		text-align: center;
		transition: all 0.15s;
	}
	.dev-pre:hover {
		border-color: var(--gold);
		color: var(--gold);
	}
	.dev-pre.on {
		background: rgba(200, 164, 78, 0.1);
		border-color: var(--gold);
		color: var(--gold);
	}
</style>
