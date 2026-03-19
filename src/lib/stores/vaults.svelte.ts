import {
	VAULTS,
	getVaultsForChain,
	formatTokenAmount,
	parseTokenAmount,
	type VaultId,
	type SupportedChainId,
} from '@yo-protocol/core';
import type { Address } from 'viem';
import { getYoClient } from '$lib/config/yo';
import { wallet } from '$lib/stores/wallet.svelte';
import { config } from '$lib/config/wagmi';
import { sendTransaction, waitForTransactionReceipt } from '@wagmi/core';
import type { Vault } from '$lib/types/vault';

const ICONS: Record<string, string> = {
	yoUSD: '$',
	yoETH: '◆',
	yoBTC: '₿',
	yoEUR: '€',
	yoGOLD: 'Au',
	yoUSDT: '₮',
};

const CHAIN_NAMES: Record<number, string> = {
	1: 'Ethereum',
	8453: 'Base',
	42161: 'Arbitrum',
};

// Reactive state
let vaults = $state<Vault[]>([]);
let loading = $state(false);
let txPending = $state(false);
let prices = $state<Record<string, number>>({});

function getChainId(): SupportedChainId {
	const id = wallet.chainId;
	if (id === 1 || id === 8453 || id === 42161) return id;
	return 8453;
}

function fmtNum(n: number): string {
	if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	if (n >= 1) return n.toFixed(2);
	if (n > 0) return n.toFixed(4);
	return '0';
}

async function fetchVaults() {
	loading = true;
	try {
		const chainId = getChainId();
		const yo = getYoClient(chainId);

		// Fetch live vault stats and prices in parallel
		const [allStats, priceMap] = await Promise.all([
			yo.getVaults(),
			yo.getPrices().catch(() => ({} as Record<string, number>)),
		]);
		prices = priceMap;

		// Get vault configs for connected chain
		const configs = getVaultsForChain(chainId);

		const mapped: Vault[] = configs.map((vc) => {
			const vaultId = vc.symbol as VaultId;
			const tokenAddr = vc.underlying.address[chainId];

			// Match API stats by vault address
			const stat = allStats.find(
				(s) => s.contracts.vaultAddress.toLowerCase() === vc.address.toLowerCase()
			);

			const apy7d = stat?.yield?.['7d'] ? parseFloat(stat.yield['7d']) : 0;

			return {
				id: vaultId,
				name: vaultId,
				icon: ICONS[vaultId] || '?',
				sub: `${vc.underlying.symbol} · ${CHAIN_NAMES[chainId] || 'Unknown'}`,
				earned: '-',
				earnedRaw: 0,
				apy: `${apy7d.toFixed(2)}%`,
				apyNum: apy7d,
				deposited: '-',
				dailyEst: '-',
				walletBalance: '-',
				vaultAddress: vc.address as `0x${string}`,
				underlyingAddress: (tokenAddr || '0x0') as `0x${string}`,
				underlyingDecimals: vc.underlying.decimals,
				shares: 0n,
				depositedRaw: 0n,
				walletBalanceRaw: 0n,
			};
		});

		vaults = mapped;

		if (wallet.isConnected && wallet.address) {
			await fetchUserData();
		}
	} catch (e) {
		console.error('[vaultStore] fetchVaults failed:', e);
	} finally {
		loading = false;
	}
}

async function fetchUserData() {
	if (!wallet.address) return;

	const chainId = getChainId();
	const yo = getYoClient(chainId);
	const address = wallet.address as Address;

	const results = await Promise.allSettled(
		vaults.map(async (v) => {
			const [position, tokenBal] = await Promise.all([
				yo.getUserPosition(v.vaultAddress as Address, address),
				v.underlyingAddress !== ('0x0' as `0x${string}`)
					? yo.getTokenBalance(v.underlyingAddress as Address, address)
					: Promise.resolve({ balance: 0n, decimals: v.underlyingDecimals }),
			]);

			let earnedNum = 0;
			try {
				const perf = await yo.getUserPerformance(v.vaultAddress as Address, address);
				earnedNum = parseFloat(perf.unrealized?.formatted || '0');
			} catch {
				// No performance data yet
			}

			return { id: v.id, shares: position.shares, assets: position.assets, walletBalance: tokenBal.balance, earned: earnedNum };
		})
	);

	for (const result of results) {
		if (result.status !== 'fulfilled') continue;
		const data = result.value;
		const idx = vaults.findIndex((v) => v.id === data.id);
		if (idx < 0) continue;

		const v = vaults[idx];
		const dec = v.underlyingDecimals;
		const isUsd = v.id === 'yoUSD' || v.id === 'yoUSDT';
		const sym = isUsd ? '$' : '';
		const tokenSym = v.sub.split(' ·')[0];
		const suffix = isUsd ? '' : ` ${tokenSym}`;

		const depositedFmt = formatTokenAmount(data.assets, dec);
		const walletFmt = formatTokenAmount(data.walletBalance, dec);
		const depositedNum = parseFloat(depositedFmt);
		const dailyEst = depositedNum * (v.apyNum / 100 / 365);

		vaults[idx] = {
			...v,
			shares: data.shares,
			depositedRaw: data.assets,
			walletBalanceRaw: data.walletBalance,
			deposited: data.assets > 0n ? (isUsd ? `$${fmtNum(depositedNum)}` : `${depositedFmt}${suffix}`) : '-',
			walletBalance: `${fmtNum(parseFloat(walletFmt))} ${tokenSym}`,
			earned: data.earned > 0 ? `+${sym}${data.earned.toFixed(2)}${suffix}` : '-',
			earnedRaw: data.earned,
			dailyEst: dailyEst > 0.001 ? `+${sym}${dailyEst.toFixed(dailyEst < 0.01 ? 4 : 2)}${suffix}` : '-',
		};
	}
}

async function deposit(vault: Vault, amountStr: string): Promise<`0x${string}`> {
	if (!wallet.address) throw new Error('Wallet not connected');

	const chainId = getChainId();
	const yo = getYoClient(chainId);
	const address = wallet.address as Address;
	const amount = parseTokenAmount(amountStr, vault.underlyingDecimals);

	txPending = true;
	try {
		const txs = await yo.prepareDepositWithApproval({
			vault: vault.vaultAddress as Address,
			token: vault.underlyingAddress as Address,
			owner: address,
			recipient: address,
			amount,
		});

		let lastHash: `0x${string}` = '0x0';
		for (const tx of txs) {
			lastHash = await sendTransaction(config, {
				to: tx.to,
				data: tx.data,
				value: tx.value ?? 0n,
			});
			await waitForTransactionReceipt(config, { hash: lastHash });
		}

		await fetchUserData();
		return lastHash;
	} finally {
		txPending = false;
	}
}

async function redeem(vault: Vault, amountStr: string): Promise<`0x${string}`> {
	if (!wallet.address) throw new Error('Wallet not connected');

	const chainId = getChainId();
	const yo = getYoClient(chainId);
	const address = wallet.address as Address;

	// Convert underlying amount to shares
	const amount = parseTokenAmount(amountStr, vault.underlyingDecimals);
	const shares = await yo.convertToShares(vault.vaultAddress as Address, amount);

	txPending = true;
	try {
		const txs = await yo.prepareRedeemWithApproval({
			vault: vault.vaultAddress as Address,
			shares,
			owner: address,
			recipient: address,
		});

		let lastHash: `0x${string}` = '0x0';
		for (const tx of txs) {
			lastHash = await sendTransaction(config, {
				to: tx.to,
				data: tx.data,
				value: tx.value ?? 0n,
			});
			await waitForTransactionReceipt(config, { hash: lastHash });
		}

		await fetchUserData();
		return lastHash;
	} finally {
		txPending = false;
	}
}

// Compute total deposited value in USD
function getTotalDepositedUsd(): number {
	return vaults.reduce((sum, v) => {
		if (v.depositedRaw === 0n) return sum;
		const depositedNum = parseFloat(formatTokenAmount(v.depositedRaw, v.underlyingDecimals));
		// Get USD price from prices map
		const price = prices[v.underlyingAddress.toLowerCase()] ?? (v.id === 'yoUSD' || v.id === 'yoUSDT' ? 1 : 0);
		return sum + depositedNum * price;
	}, 0);
}

export const vaultStore = {
	get vaults() { return vaults; },
	get loading() { return loading; },
	get txPending() { return txPending; },
	get prices() { return prices; },

	get totalEarned() {
		return vaults.reduce((sum, v) => sum + v.earnedRaw, 0);
	},
	get avgApy() {
		const active = vaults.filter((v) => v.apyNum > 0);
		if (!active.length) return 0;
		return active.reduce((sum, v) => sum + v.apyNum, 0) / active.length;
	},
	get totalDepositedUsd() {
		return getTotalDepositedUsd();
	},

	fetchVaults,
	fetchUserData,
	deposit,
	redeem,
};
