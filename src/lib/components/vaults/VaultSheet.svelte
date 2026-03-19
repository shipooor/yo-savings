<script lang="ts">
	import ConfirmModal from './ConfirmModal.svelte';
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
	let confirmShow = $state(false);
	let processing = $state(false);

	// Reset state when vault changes
	$effect(() => {
		if (show) {
			mode = 'deposit';
			amount = '';
			confirmShow = false;
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
			// Use raw wallet balance for precision
			if (vault.walletBalanceRaw > 0n) {
				amount = formatTokenAmount(vault.walletBalanceRaw, vault.underlyingDecimals);
			} else {
				const source = vault.walletBalance;
				const cleaned = source.replace(/[^0-9.,]/g, '').replace(/,/g, '');
				const match = cleaned.match(/[\d]+(?:\.[\d]+)?/);
				amount = match ? match[0] : '';
			}
		} else {
			// Use raw deposited balance for precision
			if (vault.depositedRaw > 0n) {
				amount = formatTokenAmount(vault.depositedRaw, vault.underlyingDecimals);
			} else {
				const source = vault.deposited;
				const cleaned = source.replace(/[^0-9.,]/g, '').replace(/,/g, '');
				const match = cleaned.match(/[\d]+(?:\.[\d]+)?/);
				amount = match ? match[0] : '';
			}
		}
	}

	function handleAction() {
		if (!amount || !isValidAmount(amount)) return;
		confirmShow = true;
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
			confirmShow = false;
			amount = '';
			setTimeout(() => onclose(), 350);
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Transaction failed';
			// Clean up common wallet error messages
			const cleanMsg = msg.includes('User rejected') ? 'Transaction rejected' : msg;
			toasts.error(cleanMsg);
			confirmShow = false;
		} finally {
			processing = false;
		}
	}

	function handleConfirmCancel() {
		if (!processing) {
			confirmShow = false;
		}
	}
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape' && show && !confirmShow && !processing) onclose(); }} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="vault-sheet-overlay" class:show onclick={handleOverlayClick}>
	<div class="vault-sheet">
		{#if vault}
			<button class="vs-close" onclick={onclose} disabled={processing} aria-label="Close">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
			</button>

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
				<button
					class="act-tab"
					class:dep-mode={mode === 'deposit'}
					onclick={() => (mode = 'deposit')}
				>
					Deposit
				</button>
				<button
					class="act-tab"
					class:red-mode={mode === 'withdraw'}
					onclick={() => (mode = 'withdraw')}
				>
					Withdraw
				</button>
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
						disabled={processing}
					/>
					<button class="act-max" onclick={handleMax} disabled={processing}>MAX</button>
				</div>
				<button
					class="act-btn {mode === 'deposit' ? 'dep' : 'red'}"
					onclick={handleAction}
					disabled={processing}
				>
					{mode === 'deposit' ? 'Deposit' : 'Withdraw'}
				</button>
			</div>

			<div class="act-info">
				<span>{mode === 'deposit' ? 'Wallet balance:' : 'Deposited:'}</span>
				<span class="hi">{mode === 'deposit' ? vault.walletBalance : vault.deposited}</span>
			</div>
		{/if}
	</div>
</div>

{#if vault}
	<ConfirmModal
		show={confirmShow}
		{mode}
		amount={amount}
		vaultName={vault.name}
		apy={vault.apy}
		{processing}
		oncancel={handleConfirmCancel}
		onconfirm={handleConfirm}
	/>
{/if}

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
	.vs-close:disabled {
		opacity: 0.3;
		cursor: not-allowed;
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
		background: transparent;
		border-radius: 0;
		padding: 0;
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
	.act-in:disabled {
		opacity: 0.5;
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
	.act-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.act-btn.dep {
		background: var(--gold);
		box-shadow: 0 0 20px rgba(200, 164, 78, 0.2);
	}
	.act-btn.dep:active:not(:disabled) {
		transform: scale(0.95);
	}
	.act-btn.red {
		background: var(--red);
		box-shadow: 0 0 20px rgba(232, 132, 90, 0.15);
	}
	.act-btn.red:active:not(:disabled) {
		transform: scale(0.95);
	}
	.act-info {
		display: flex;
		justify-content: space-between;
		font-size: 12px;
		color: var(--text-dim);
	}
	.act-info .hi {
		color: var(--gold);
	}
</style>
