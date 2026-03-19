<script lang="ts">
	import { onMount } from 'svelte';
	import VaultSheet from './VaultSheet.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { wallet } from '$lib/stores/wallet.svelte';
	import { vaultStore } from '$lib/stores/vaults.svelte';
	import { balanceStore } from '$lib/stores/balance.svelte';
	import type { Vault } from '$lib/types/vault';

	let selectedVault = $state<Vault | null>(null);
	let sheetOpen = $state(false);
	let prevAddress = $state<string | undefined>(undefined);

	// Computed totals from real data
	let totalEarned = $derived(vaultStore.totalEarned);
	let avgApy = $derived(vaultStore.avgApy);

	onMount(() => {
		vaultStore.fetchVaults();
	});

	// Refetch user data when wallet connects/disconnects
	$effect(() => {
		const addr = wallet.address;
		if (addr !== prevAddress) {
			prevAddress = addr;
			if (addr) {
				vaultStore.fetchUserData().then(() => {
					// Seed balance store with real data
					const totalUsd = vaultStore.totalDepositedUsd;
					if (totalUsd > 0) {
						balanceStore.seedReal(totalUsd, vaultStore.avgApy, vaultStore.totalEarned);
					}
				});
			} else {
				balanceStore.seedDemo();
			}
		}
	});

	function openVault(vault: Vault) {
		selectedVault = vault;
		sheetOpen = true;
	}

	function closeSheet() {
		sheetOpen = false;
		selectedVault = null;
	}
</script>

{#if wallet.isConnected}
<section class="vaults-screen">
	{#if vaultStore.loading && vaultStore.vaults.length === 0}
		<div class="v-loading">
			<div class="v-spinner"></div>
			<div class="v-loading-text">Loading vaults...</div>
		</div>
	{:else}
		<div class="v-hero">
			<div class="v-hero-lbl">Total Earned</div>
			<div class="v-hero-num"><span class="v-hero-sign">+$</span>{totalEarned.toFixed(2)}</div>
			<div class="v-hero-sub"><span class="v-dot"></span> across {vaultStore.vaults.length} vaults · multichain</div>
			<div class="v-hero-apy">avg {avgApy.toFixed(2)}% APY</div>
		</div>

		<div class="vault-list">
			{#each vaultStore.vaults as vault (vault.id)}
				<div class="vault-card" onclick={() => openVault(vault)} role="button" tabindex="0" onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') openVault(vault); }}>
					<span class="vault-chevron">›</span>
					<div class="vault-card-inner">
						<div class="vc-left">
							<div class="vc-icon">{vault.icon}</div>
							<div class="vc-info">
								<div class="vc-name">{vault.name}</div>
								<div class="vc-sub">{vault.sub}</div>
							</div>
						</div>
						<div class="vc-right">
							<div class="vc-earned">{vault.earned}</div>
							<div class="vc-apy"><b>{vault.apy}</b> APY</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>

<VaultSheet show={sheetOpen} vault={selectedVault} onclose={closeSheet} />
{:else}
<section class="vaults-screen">
	<EmptyState title="Your vaults" subtitle="Connect your wallet to see vault positions and start earning yield">
		{#snippet icon()}
			<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
				<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
			</svg>
		{/snippet}
	</EmptyState>
</section>
{/if}

<style>
	.vaults-screen {
		padding: 0 24px;
		padding-bottom: 90px;
	}

	/* Loading */
	.v-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 120px 0;
		gap: 16px;
	}
	.v-spinner {
		width: 24px;
		height: 24px;
		border: 2px solid rgba(200, 164, 78, 0.15);
		border-top-color: var(--gold);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	.v-loading-text {
		font-size: 12px;
		color: var(--text-dim);
		letter-spacing: 1px;
	}

	/* Hero */
	.v-hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 40px 0 20px;
		position: relative;
	}
	.v-hero::before {
		content: '';
		position: absolute;
		top: 20px;
		left: 50%;
		transform: translateX(-50%);
		width: 280px;
		height: 280px;
		background: radial-gradient(circle, rgba(200, 164, 78, 0.06) 0%, transparent 65%);
		pointer-events: none;
		animation: -global-glowPulse 6s ease-in-out infinite;
	}
	.v-hero-lbl {
		font-size: 10px;
		color: var(--text-dim);
		letter-spacing: 2.5px;
		text-transform: uppercase;
		margin-bottom: 16px;
		font-weight: 400;
	}
	.v-hero-num {
		font-family: var(--font-tight);
		font-size: 56px;
		font-weight: 200;
		letter-spacing: -3px;
		color: var(--gold);
		font-variant-numeric: tabular-nums;
		text-shadow: 0 0 40px rgba(200, 164, 78, 0.15);
		position: relative;
	}
	.v-hero-num .v-hero-sign {
		font-weight: 200;
		font-size: 36px;
		margin-right: 2px;
		color: var(--gold-light);
	}
	.v-hero-sub {
		margin-top: 14px;
		font-size: 11px;
		color: var(--text-dim);
		font-weight: 300;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.v-hero-sub .v-dot {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--green);
		box-shadow: 0 0 6px var(--green);
	}
	.v-hero-apy {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--gold-light);
		letter-spacing: 0.5px;
		margin-top: 6px;
	}

	/* Vault list */
	.vault-list {
		display: flex;
		flex-direction: column;
		gap: 0;
		margin-top: 12px;
	}
	.vault-card {
		background: transparent;
		border: none;
		border-radius: 0;
		padding: 16px 0;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		position: relative;
		overflow: visible;
		box-shadow: none;
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
		padding-right: 20px;
	}
	.vault-card:first-child {
		border-top: 1px solid rgba(255, 255, 255, 0.04);
	}
	.vault-card:last-of-type {
		border-bottom: none;
	}
	.vault-card:active {
		opacity: 0.7;
		background: rgba(255, 255, 255, 0.02);
	}
	.vault-card-inner {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.vc-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.vc-icon {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		font-weight: 500;
		background: transparent;
		border: 1px solid rgba(200, 164, 78, 0.1);
		color: var(--gold);
		flex-shrink: 0;
	}
	.vc-info {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.vc-name {
		font-size: 15px;
		font-weight: 400;
		letter-spacing: -0.2px;
		color: var(--text);
	}
	.vc-sub {
		font-size: 11px;
		color: var(--text-dim);
		font-weight: 300;
	}
	.vc-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 1px;
	}
	.vc-earned {
		font-family: var(--font-tight);
		font-size: 14px;
		font-weight: 400;
		color: var(--gold);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.3px;
	}
	.vc-apy {
		font-size: 11px;
		color: var(--text-dim);
		font-weight: 300;
	}
	.vc-apy :global(b) {
		color: var(--gold-light);
		font-weight: 400;
	}
	.vault-chevron {
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		font-size: 14px;
		color: var(--text-secondary);
		font-weight: 300;
		transition: all 0.3s;
	}
</style>
