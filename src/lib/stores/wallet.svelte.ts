import {
	getAccount,
	watchAccount,
	disconnect,
	type GetAccountReturnType
} from '@wagmi/core';
import { config, appKit } from '$lib/config/wagmi';

let account = $state<GetAccountReturnType>(getAccount(config));

// Global subscription — lives for the app lifetime, no cleanup needed
if (typeof window !== 'undefined') {
	watchAccount(config, {
		onChange(data) {
			account = data;
		}
	});
}

export const wallet = {
	get address() {
		return account.address;
	},
	get isConnected() {
		return account.isConnected;
	},
	get chainId() {
		return account.chainId;
	},
	get status() {
		return account.status;
	},

	open() {
		appKit?.open();
	},

	async disconnect() {
		return disconnect(config);
	}
};

export function formatAddress(addr: string | undefined): string {
	if (!addr) return '';
	return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
