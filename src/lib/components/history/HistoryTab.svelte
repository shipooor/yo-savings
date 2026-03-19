<script lang="ts">
	import { wallet } from '$lib/stores/wallet.svelte';
	import { vaultStore } from '$lib/stores/vaults.svelte';
	import { getYoClient } from '$lib/config/yo';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import type { Address } from 'viem';

	type TxType = 'deposit' | 'redeem';

	type Transaction = {
		id: string;
		type: TxType;
		title: string;
		time: string;
		amount: string;
		amountClass: 'pos' | 'neg';
		vault: string;
		timestamp: number;
		txHash: string;
	};

	type DayGroup = {
		label: string;
		txs: Transaction[];
	};

	const iconClass: Record<TxType, string> = {
		deposit: 'dep',
		redeem: 'red',
	};

	const VAULT_NAMES: Record<string, string> = {};

	let history = $state<DayGroup[]>([]);
	let loading = $state(false);
	let prevAddress = $state<string | undefined>(undefined);

	type FilterType = 'all' | 'deposits' | 'withdrawals';
	let filter = $state<FilterType>('all');

	const filters: { id: FilterType; label: string }[] = [
		{ id: 'all', label: 'All' },
		{ id: 'deposits', label: 'Deposits' },
		{ id: 'withdrawals', label: 'Withdrawals' },
	];

	let filteredHistory = $derived(
		history
			.map((group) => ({
				...group,
				txs: group.txs.filter((tx) => {
					if (filter === 'all') return true;
					if (filter === 'deposits') return tx.type === 'deposit';
					if (filter === 'withdrawals') return tx.type === 'redeem';
					return true;
				}),
			}))
			.filter((group) => group.txs.length > 0)
	);

	function formatTime(ts: number): string {
		const d = new Date(ts * 1000);
		return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
	}

	function formatDate(ts: number): string {
		const d = new Date(ts * 1000);
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const txDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

		if (txDay.getTime() === today.getTime()) return 'Today';

		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		if (txDay.getTime() === yesterday.getTime()) return 'Yesterday';

		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function getVaultName(address: string): string {
		const v = vaultStore.vaults.find(
			(v) => v.vaultAddress.toLowerCase() === address.toLowerCase()
		);
		return v?.name || address.slice(0, 8) + '...';
	}

	function getVaultDecimals(address: string): number {
		const v = vaultStore.vaults.find(
			(v) => v.vaultAddress.toLowerCase() === address.toLowerCase()
		);
		return v?.underlyingDecimals ?? 6;
	}

	function getTokenSymbol(vaultName: string): string {
		const isUsd = vaultName === 'yoUSD' || vaultName === 'yoUSDT';
		if (isUsd) return '$';
		return '';
	}

	function getTokenSuffix(vaultName: string): string {
		const isUsd = vaultName === 'yoUSD' || vaultName === 'yoUSDT';
		if (isUsd) return '';
		const sub = vaultStore.vaults.find((v) => v.name === vaultName)?.sub || '';
		const tokenSym = sub.split(' ·')[0];
		return ` ${tokenSym}`;
	}

	async function fetchHistory() {
		if (!wallet.address || vaultStore.vaults.length === 0) return;

		loading = true;
		try {
			const chainId = wallet.chainId === 1 || wallet.chainId === 8453 || wallet.chainId === 42161
				? wallet.chainId
				: 8453;
			const yo = getYoClient(chainId as 8453);
			const address = wallet.address as Address;

			const results = await Promise.allSettled(
				vaultStore.vaults.map(async (v) => {
					const items = await yo.getUserHistory(v.vaultAddress as Address, address, 20);
					return { vaultAddress: v.vaultAddress, items: Array.isArray(items) ? items : (items as any)?.items || [] };
				})
			);

			const allTxs: Transaction[] = [];
			for (const result of results) {
				if (result.status !== 'fulfilled') continue;
				const { vaultAddress, items } = result.value;
				const vaultName = getVaultName(vaultAddress);
				const prefix = getTokenSymbol(vaultName);
				const suffix = getTokenSuffix(vaultName);

				for (const item of items) {
					const type = item.type?.toLowerCase() === 'deposit' ? 'deposit' as const : 'redeem' as const;
					const formatted = item.assets?.formatted || '0';
					const sign = type === 'deposit' ? '+' : '-';

					allTxs.push({
						id: item.transactionHash || `${vaultAddress}-${item.blockTimestamp}`,
						type,
						title: type === 'deposit' ? 'Deposit' : 'Withdraw',
						time: formatTime(item.blockTimestamp),
						amount: `${sign}${prefix}${formatted}${suffix}`,
						amountClass: type === 'deposit' ? 'pos' : 'neg',
						vault: vaultName,
						timestamp: item.blockTimestamp,
						txHash: item.transactionHash || '',
					});
				}
			}

			// Sort by timestamp descending
			allTxs.sort((a, b) => b.timestamp - a.timestamp);

			// Group by day
			const groups = new Map<string, Transaction[]>();
			for (const tx of allTxs) {
				const label = formatDate(tx.timestamp);
				if (!groups.has(label)) groups.set(label, []);
				groups.get(label)!.push(tx);
			}

			history = Array.from(groups.entries()).map(([label, txs]) => ({ label, txs }));
		} catch (e) {
			console.error('[HistoryTab] fetchHistory failed:', e);
		} finally {
			loading = false;
		}
	}

	// Refetch when wallet changes or vaults load
	$effect(() => {
		const addr = wallet.address;
		const vaultCount = vaultStore.vaults.length;
		if (addr && vaultCount > 0 && addr !== prevAddress) {
			prevAddress = addr;
			fetchHistory();
		}
	});
</script>

{#if !wallet.isConnected}
<section class="history-screen">
	<EmptyState title="Transaction history" subtitle="Connect your wallet to see your deposit, withdrawal, and yield history">
		{#snippet icon()}
			<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="9"/><polyline points="12,7 12,12 16,14"/>
			</svg>
		{/snippet}
	</EmptyState>
</section>
{:else}
<section class="history-screen">
	<div class="history-header">
		<div class="history-title">History</div>
	</div>

	{#if loading && history.length === 0}
		<div class="h-loading">
			<div class="h-spinner"></div>
			<div class="h-loading-text">Loading history...</div>
		</div>
	{:else if history.length === 0}
		<div class="h-empty">
			<div class="h-empty-text">No transactions yet</div>
			<div class="h-empty-sub">Deposit into a vault to see your history here</div>
		</div>
	{:else}
		<div class="h-filters">
			{#each filters as f}
				<button
					class="h-fil"
					class:on={filter === f.id}
					aria-label="Filter by {f.label}"
					onclick={() => (filter = f.id)}
				>
					{f.label}
				</button>
			{/each}
		</div>

		<div class="history-list">
			{#each filteredHistory as group (group.label)}
				<div class="history-date">{group.label}</div>
				{#each group.txs as tx (tx.id)}
					<div class="history-item">
						<div class="history-icon {iconClass[tx.type]}">
							<svg viewBox="0 0 24 24">
								{#if tx.type === 'deposit'}
									<path d="M12 19V5M5 12l7-7 7 7"/>
								{:else}
									<path d="M12 5v14M19 12l-7 7-7-7"/>
								{/if}
							</svg>
						</div>
						<div class="history-body">
							<div class="history-item-title">{tx.title}</div>
							<div class="history-time">{tx.time}</div>
						</div>
						<div class="history-value">
							<div class="history-amount {tx.amountClass}">{tx.amount}</div>
							<div class="history-vault">{tx.vault}</div>
						</div>
					</div>
				{/each}
			{/each}
		</div>
	{/if}
</section>
{/if}

<style>
	.history-screen {
		padding: 0 24px;
		padding-bottom: 90px;
	}
	.history-header {
		padding: 48px 0 24px;
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.history-title {
		font-family: var(--font-tight);
		font-size: 22px;
		font-weight: 300;
		letter-spacing: -0.5px;
		color: var(--text-secondary);
	}

	/* Loading */
	.h-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80px 0;
		gap: 16px;
	}
	.h-spinner {
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
	.h-loading-text {
		font-size: 12px;
		color: var(--text-dim);
		letter-spacing: 1px;
	}

	/* Empty */
	.h-empty {
		text-align: center;
		padding: 80px 0;
	}
	.h-empty-text {
		font-size: 14px;
		color: var(--text-secondary);
		margin-bottom: 6px;
	}
	.h-empty-sub {
		font-size: 12px;
		color: var(--text-dim);
	}

	/* Filters */
	.h-filters {
		display: flex;
		gap: 6px;
		padding: 12px 0 0;
		overflow-x: auto;
	}
	.h-fil {
		padding: 6px 14px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 100px;
		background: transparent;
		color: var(--text-dim);
		font-family: var(--font-sans);
		font-size: 11px;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
		-webkit-tap-highlight-color: transparent;
	}
	.h-fil.on {
		color: var(--gold);
		border-color: rgba(200, 164, 78, 0.25);
		background: rgba(200, 164, 78, 0.06);
	}

	/* Transaction list */
	.history-list {
		display: flex;
		flex-direction: column;
		gap: 0;
	}
	.history-date {
		font-size: 10px;
		color: var(--text-dim);
		text-transform: uppercase;
		letter-spacing: 3px;
		padding: 28px 0 12px;
		font-weight: 300;
	}
	.history-item {
		display: flex;
		align-items: center;
		padding: 18px 0;
		gap: 14px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.03);
	}
	.history-item:last-child {
		border-bottom: none;
	}

	/* Transaction icon */
	.history-icon {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border: 1px solid rgba(255, 255, 255, 0.06);
		background: transparent;
	}
	.history-icon :global(svg) {
		width: 16px;
		height: 16px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.history-icon.dep {
		color: var(--gold);
		border-color: rgba(200, 164, 78, 0.15);
	}
	.history-icon.red {
		color: var(--red);
		border-color: rgba(232, 132, 90, 0.12);
	}

	/* Transaction body */
	.history-body {
		flex: 1;
	}
	.history-item-title {
		font-size: 13px;
		font-weight: 400;
		letter-spacing: -0.1px;
	}
	.history-time {
		font-size: 11px;
		color: var(--text-dim);
		margin-top: 2px;
	}

	/* Transaction value */
	.history-value {
		text-align: right;
	}
	.history-amount {
		font-family: var(--font-tight);
		font-size: 14px;
		font-weight: 400;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.3px;
	}
	.history-amount.pos {
		color: var(--gold-light);
	}
	.history-amount.neg {
		color: var(--text-secondary);
	}
	.history-vault {
		font-size: 11px;
		color: var(--text-dim);
		margin-top: 2px;
		font-weight: 300;
	}
</style>
