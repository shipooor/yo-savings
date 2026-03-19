<script lang="ts">
	import type { Vault } from '$lib/types/vault';
	import { audio } from '$lib/stores/audio.svelte';
	import { confettiStore } from '$lib/stores/confetti.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import { vaultStore } from '$lib/stores/vaults.svelte';
	import { formatTokenAmount } from '@yo-protocol/core';

	type VaultSheetProps = {
		show: boolean;
		vault: Vault | null;
		onclose: () => void;
	};

	let { show, vault, onclose }: VaultSheetProps = $props();

	let mode = $state<'deposit' | 'withdraw'>('deposit');
	let amount = $state('');
	let confirming = $state(false);
	let processing = $state(false);

	$effect(() => {
		if (show) {
			mode = 'deposit';
			amount = '';
			confirming = false;
			processing = false;
		}
	});

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget && !processing) {
			onclose();
		}
	}

	function isValidAmount(input: string): boolean {
		if (!/^\d+(\.\d+)?$/.test(input)) return false;
		const num = Number(input);
		return num > 0 && num <= 1_000_000_000 && Number.isFinite(num);
	}

	function handleAmountInput(e: Event) {
		const input = e.target as HTMLInputElement;
		let val = input.value.replace(/[^0-9.]/g, '');
		const parts = val.split('.');
		if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
		amount = val;
		input.value = val;
	}

	function handleMax() {
		if (!vault) return;
		if (mode === 'deposit') {
			if (vault.walletBalanceRaw > 0n) {
				amount = formatTokenAmount(vault.walletBalanceRaw, vault.underlyingDecimals);
			} else {
				const cleaned = vault.walletBalance.replace(/[^0-9.,]/g, '').replace(/,/g, '');
				const match = cleaned.match(/[\d]+(?:\.[\d]+)?/);
				amount = match ? match[0] : '';
			}
		} else {
			if (vault.depositedRaw > 0n) {
				amount = formatTokenAmount(vault.depositedRaw, vault.underlyingDecimals);
			} else {
				const cleaned = vault.deposited.replace(/[^0-9.,]/g, '').replace(/,/g, '');
				const match = cleaned.match(/[\d]+(?:\.[\d]+)?/);
				amount = match ? match[0] : '';
			}
		}
	}

	function handleAction() {
		if (!amount || !isValidAmount(amount)) return;
		confirming = true;
	}

	function handleBack() {
		if (!processing) confirming = false;
	}

	async function handleConfirm() {
		if (!vault || processing) return;
		processing = true;
		try {
			if (mode === 'deposit') {
				await vaultStore.deposit(vault, amount);
				toasts.success(`Deposited ${amount} into ${vault.name}`);
			} else {
				await vaultStore.redeem(vault, amount);
				toasts.success(`Withdrawn ${amount} from ${vault.name}`);
			}
			audio.chime();
			confettiStore.fire();
			confirming = false;
			amount = '';
			setTimeout(() => onclose(), 350);
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Transaction failed';
			const cleanMsg = msg.includes('User rejected') ? 'Transaction rejected' : msg;
			toasts.error(cleanMsg);
			confirming = false;
		} finally {
			processing = false;
		}
	}
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape' && show && !processing) { if (confirming) confirming = false; else onclose(); } }} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="vault-sheet-overlay" class:show onclick={handleOverlayClick}>
	<div class="vault-sheet">
		{#if vault}
			<button class="vs-close" onclick={() => { if (!processing) { if (confirming) confirming = false; else onclose(); }}} aria-label={confirming ? 'Back' : 'Close'}>
				{#if confirming}
					<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
				{:else}
					<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
				{/if}
			</button>

			{#if !confirming}
				<div class="vs-header">
					<div class="vs-icon">{vault.icon}</div>
					<div>
						<div class="vs-title">{vault.name}</div>
						<div class="vs-chain">{vault.sub}</div>
					</div>
				</div>

				<div class="vs-stats">
					<div class="vs-stat">
						<div class="vs-stat-lbl">Deposited</div>
						<div class="vs-stat-val">{vault.deposited}</div>
					</div>
					<div class="vs-stat">
						<div class="vs-stat-lbl">APY</div>
						<div class="vs-stat-val gold">{vault.apy}</div>
					</div>
					<div class="vs-stat">
						<div class="vs-stat-lbl">Earned</div>
						<div class="vs-stat-val gold">{vault.earned}</div>
					</div>
					<div class="vs-stat">
						<div class="vs-stat-lbl">Daily est.</div>
						<div class="vs-stat-val">{vault.dailyEst}</div>
					</div>
				</div>

				<div class="act-tabs">
					<button class="act-tab" class:dep-mode={mode === 'deposit'} onclick={() => (mode = 'deposit')}>Deposit</button>
					<button class="act-tab" class:red-mode={mode === 'withdraw'} onclick={() => (mode = 'withdraw')}>Withdraw</button>
				</div>

				<div class="act-row">
					<div class="act-in-wrap">
						<input
							class="act-in"
							type="text"
							inputmode="decimal"
							placeholder="0.00"
							maxlength={20}
							value={amount}
							oninput={handleAmountInput}
						/>
						<button class="act-max" onclick={handleMax}>MAX</button>
					</div>
					<button class="act-btn {mode === 'deposit' ? 'dep' : 'red'}" onclick={handleAction}>
						{mode === 'deposit' ? 'Deposit' : 'Withdraw'}
					</button>
				</div>

				<div class="act-info">
					<span>{mode === 'deposit' ? 'Wallet balance:' : 'Deposited:'}</span>
					<span class="hi">{mode === 'deposit' ? vault.walletBalance : vault.deposited}</span>
				</div>
			{:else}
				<!-- Confirm view — inline -->
				<div class="confirm-view">
					<div class="cf-title">Confirm {mode === 'deposit' ? 'Deposit' : 'Withdrawal'}</div>

					<div class="cf-amount">
						<span class="cf-num">{amount}</span>
						<span class="cf-token">{vault.name.replace('yo', '')}</span>
					</div>

					<div class="cf-rows">
						<div class="cf-row">
							<span>Vault</span>
							<span class="cf-val">{vault.name}</span>
						</div>
						<div class="cf-row">
							<span>Est. APY</span>
							<span class="cf-val gold">{vault.apy}</span>
						</div>
						<div class="cf-row">
							<span>Network</span>
							<span class="cf-val">{vault.sub.split(' · ')[1] || 'Base'}</span>
						</div>
					</div>

					<button
						class="cf-btn {mode === 'deposit' ? 'dep' : 'red'}"
						onclick={handleConfirm}
						disabled={processing}
					>
						{#if processing}
							<span class="cf-spinner"></span>
							Processing...
						{:else}
							Confirm {mode === 'deposit' ? 'Deposit' : 'Withdrawal'}
						{/if}
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.vault-sheet-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		z-index: 350;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.3s;
	}
	.vault-sheet-overlay.show {
		opacity: 1;
		pointer-events: auto;
	}
	.vault-sheet {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) scale(0.95);
		width: calc(100% - 32px);
		max-width: 400px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 20px;
		padding: 20px 24px 24px;
		z-index: 360;
		max-height: calc(100vh - 48px);
		overflow-y: auto;
		opacity: 0;
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.vault-sheet-overlay.show .vault-sheet {
		transform: translate(-50%, -50%) scale(1);
		opacity: 1;
	}
	.vs-close {
		position: absolute;
		top: 16px;
		right: 16px;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 50%;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-dim);
		cursor: pointer;
		transition: all 0.2s;
		-webkit-tap-highlight-color: transparent;
	}
	.vs-close:hover {
		color: var(--text);
		background: rgba(255, 255, 255, 0.1);
	}
	.vs-header {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-bottom: 16px;
	}
	.vs-icon {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 18px;
		font-weight: 500;
		border: 1px solid rgba(200, 164, 78, 0.15);
		color: var(--gold);
	}
	.vs-title {
		font-size: 20px;
		font-weight: 400;
		letter-spacing: -0.5px;
	}
	.vs-chain {
		font-size: 12px;
		color: var(--text-dim);
		margin-top: 2px;
	}
	.vs-stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		margin-bottom: 16px;
	}
	.vs-stat {
		padding: 10px 14px;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.03);
	}
	.vs-stat-lbl {
		font-size: 9px;
		color: var(--text-dim);
		text-transform: uppercase;
		letter-spacing: 1.2px;
		font-weight: 400;
		margin-bottom: 4px;
	}
	.vs-stat-val {
		font-family: var(--font-tight);
		font-size: 15px;
		font-weight: 400;
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
	}
	.vs-stat-val.gold {
		color: var(--gold);
	}
	.act-tabs {
		display: flex;
		gap: 2px;
		margin-bottom: 10px;
	}
	.act-tab {
		flex: 1;
		padding: 10px;
		border: none;
		border-radius: 0;
		font-family: var(--font-sans);
		font-size: 13px;
		font-weight: 400;
		color: var(--text-dim);
		background: transparent;
		cursor: pointer;
		transition: all 0.2s;
		border-bottom: 1px solid transparent;
		-webkit-tap-highlight-color: transparent;
	}
	.act-tab.dep-mode {
		color: var(--gold);
		border-bottom-color: var(--gold);
	}
	.act-tab.red-mode {
		color: var(--red);
		border-bottom-color: var(--red);
	}
	.act-row {
		display: flex;
		gap: 10px;
		margin-top: 15px;
		margin-bottom: 12px;
	}
	.act-in-wrap {
		flex: 1;
		position: relative;
		display: flex;
	}
	.act-in {
		flex: 1;
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--border);
		border-radius: 0;
		padding: 12px 40px 12px 0;
		font-family: var(--font-tight);
		font-size: 20px;
		font-weight: 300;
		color: var(--text);
		outline: none;
		letter-spacing: -0.5px;
		width: 100%;
	}
	.act-in:focus {
		border-bottom-color: var(--gold);
	}
	.act-in::placeholder {
		color: var(--text-dim);
	}
	.act-max {
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		font-size: 10px;
		color: var(--gold);
		cursor: pointer;
		background: transparent;
		padding: 6px 0;
		border: none;
		font-family: var(--font-mono);
		letter-spacing: 1px;
	}
	.act-btn {
		border: none;
		border-radius: 100px;
		padding: 14px 0;
		min-width: 130px;
		font-family: var(--font-sans);
		font-size: 14px;
		font-weight: 500;
		color: var(--bg);
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
		min-height: 48px;
	}
	.act-btn.dep {
		background: var(--gold);
		box-shadow: 0 0 20px rgba(200, 164, 78, 0.2);
	}
	.act-btn.dep:active { transform: scale(0.95); }
	.act-btn.red {
		background: var(--red);
		box-shadow: 0 0 20px rgba(232, 132, 90, 0.15);
	}
	.act-btn.red:active { transform: scale(0.95); }
	.act-info {
		display: flex;
		justify-content: space-between;
		font-size: 12px;
		color: var(--text-dim);
	}
	.act-info .hi {
		color: var(--gold);
	}

	/* Confirm view */
	.confirm-view {
		padding-top: 8px;
	}
	.cf-title {
		font-family: var(--font-tight);
		font-size: 20px;
		font-weight: 400;
		letter-spacing: -0.5px;
		margin-bottom: 24px;
	}
	.cf-amount {
		text-align: center;
		margin-bottom: 28px;
	}
	.cf-num {
		font-family: var(--font-tight);
		font-size: 40px;
		font-weight: 200;
		letter-spacing: -2px;
	}
	.cf-token {
		font-size: 16px;
		color: var(--text-dim);
		margin-left: 8px;
		font-weight: 300;
	}
	.cf-rows {
		display: flex;
		flex-direction: column;
		gap: 0;
		margin-bottom: 28px;
	}
	.cf-row {
		display: flex;
		justify-content: space-between;
		padding: 14px 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
		font-size: 13px;
		color: var(--text-dim);
	}
	.cf-row:last-child {
		border-bottom: none;
	}
	.cf-val {
		color: var(--text);
		font-weight: 400;
	}
	.cf-val.gold {
		color: var(--gold);
	}
	.cf-btn {
		width: 100%;
		padding: 16px;
		border: none;
		border-radius: 14px;
		font-family: var(--font-sans);
		font-size: 15px;
		font-weight: 500;
		color: var(--bg);
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}
	.cf-btn.dep {
		background: var(--gold);
		box-shadow: 0 0 24px rgba(200, 164, 78, 0.25);
	}
	.cf-btn.red {
		background: var(--red);
		box-shadow: 0 0 24px rgba(232, 132, 90, 0.2);
	}
	.cf-btn:active:not(:disabled) { transform: scale(0.97); }
	.cf-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
	.cf-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(0, 0, 0, 0.2);
		border-top-color: var(--bg);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
