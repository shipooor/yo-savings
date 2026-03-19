import { createAppKit, type AppKit as AppKitType } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { base, mainnet, arbitrum } from '@reown/appkit/networks';

const projectId = import.meta.env.VITE_WC_PROJECT_ID || '';

const wagmiAdapter = new WagmiAdapter({
	projectId,
	networks: [base, mainnet, arbitrum],
});

export const config = wagmiAdapter.wagmiConfig;

// AppKit instance — used by wallet store to open the modal
export let appKit: AppKitType | null = null;

if (typeof window !== 'undefined' && projectId) {
	appKit = createAppKit({
		adapters: [wagmiAdapter],
		projectId,
		networks: [base, mainnet, arbitrum],
		defaultNetwork: base,
		metadata: {
			name: 'YO Savings',
			description: 'DeFi savings app — earn yield across ERC-4626 vaults',
			url: globalThis.location?.origin || 'https://yo-savings.app',
			icons: [],
		},
		themeMode: 'dark',
	});
}
