<script lang="ts">
	type ConfirmModalProps = {
		show: boolean;
		mode: 'deposit' | 'withdraw';
		amount: string;
		vaultName: string;
		apy: string;
		processing?: boolean;
		oncancel: () => void;
		onconfirm: () => void;
	};

	let { show, mode, amount, vaultName, apy, processing = false, oncancel, onconfirm }: ConfirmModalProps = $props();

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget && !processing) {
			oncancel();
		}
	}
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape' && show) { e.stopImmediatePropagation(); oncancel(); } }} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="modal-overlay" class:show onclick={handleOverlayClick}>
	<div class="modal">
		<div class="modal-handle"></div>
		<div class="modal-title">
			{mode === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
		</div>

		<div class="modal-row">
			<span class="modal-lbl">Amount</span>
			<span class="modal-val">{mode === 'deposit' ? '' : '-'}{amount} {vaultName === 'yoUSD' || vaultName === 'yoUSDT' ? 'USD' : vaultName.replace('yo', '')}</span>
		</div>
		<div class="modal-row">
			<span class="modal-lbl">Vault</span>
			<span class="modal-val">{vaultName}</span>
		</div>
		<div class="modal-row">
			<span class="modal-lbl">Est. APY</span>
			<span class="modal-val gold">{apy}</span>
		</div>

		<div class="modal-btns">
			<button class="modal-btn cancel" onclick={oncancel} disabled={processing}>Cancel</button>
			<button
				class="modal-btn {mode === 'deposit' ? 'confirm' : 'red-confirm'}"
				onclick={onconfirm}
				disabled={processing}
			>
				{#if processing}
					<span class="btn-spinner"></span> Processing...
				{:else}
					{mode === 'deposit' ? 'Deposit' : 'Withdraw'}
				{/if}
			</button>
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		z-index: 400;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.3s;
	}
	.modal-overlay.show {
		opacity: 1;
		pointer-events: auto;
	}
	.modal {
		width: 100%;
		max-width: 430px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 20px 20px 0 0;
		padding: 28px 24px calc(24px + env(safe-area-inset-bottom));
		transform: translateY(100%);
		transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.modal-overlay.show .modal {
		transform: translateY(0);
	}
	.modal-handle {
		width: 36px;
		height: 4px;
		border-radius: 2px;
		background: var(--border);
		margin: 0 auto 20px;
	}
	.modal-title {
		font-size: 16px;
		font-weight: 500;
		margin-bottom: 20px;
		letter-spacing: -0.3px;
	}
	.modal-row {
		display: flex;
		justify-content: space-between;
		padding: 10px 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
	}
	.modal-row:last-of-type {
		border-bottom: none;
	}
	.modal-lbl {
		font-size: 13px;
		color: var(--text-secondary);
	}
	.modal-val {
		font-size: 13px;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}
	.modal-val.gold {
		color: var(--gold);
	}
	.modal-btns {
		display: flex;
		gap: 10px;
		margin-top: 20px;
	}
	.modal-btn {
		flex: 1;
		padding: 14px;
		border: none;
		border-radius: 12px;
		font-family: var(--font-sans);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}
	.modal-btn.cancel {
		background: rgba(255, 255, 255, 0.06);
		color: var(--text-secondary);
	}
	.modal-btn.confirm {
		background: var(--gold);
		color: var(--bg);
		box-shadow: 0 0 20px rgba(200, 164, 78, 0.2);
	}
	.modal-btn.confirm:active {
		transform: scale(0.97);
	}
	.modal-btn.red-confirm {
		background: var(--red);
		color: var(--bg);
		box-shadow: 0 0 20px rgba(232, 132, 90, 0.15);
	}
	.modal-btn.red-confirm:active:not(:disabled) {
		transform: scale(0.97);
	}
	.modal-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.btn-spinner {
		display: inline-block;
		width: 14px;
		height: 14px;
		border: 2px solid rgba(0, 0, 0, 0.2);
		border-top-color: currentColor;
		border-radius: 50%;
		animation: modalSpin 0.7s linear infinite;
		vertical-align: middle;
		margin-right: 4px;
	}
	@keyframes modalSpin {
		to { transform: rotate(360deg); }
	}
</style>
