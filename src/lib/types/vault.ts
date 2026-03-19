export type VaultId = 'yoUSD' | 'yoETH' | 'yoBTC' | 'yoEUR' | 'yoGOLD' | 'yoUSDT';

// Display-oriented type with SDK data for live transactions
export type Vault = {
	id: VaultId;
	name: string;
	icon: string;
	sub: string;
	earned: string;
	earnedRaw: number;
	apy: string;
	apyNum: number;
	deposited: string;
	dailyEst: string;
	walletBalance: string;
	// SDK data for on-chain interactions
	vaultAddress: `0x${string}`;
	underlyingAddress: `0x${string}`;
	underlyingDecimals: number;
	shares: bigint;
	depositedRaw: bigint;
	walletBalanceRaw: bigint;
};
