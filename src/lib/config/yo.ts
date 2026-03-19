import { createYoClient } from '@yo-protocol/core';
import type { SupportedChainId } from '@yo-protocol/core';

const clients = new Map<SupportedChainId, ReturnType<typeof createYoClient>>();

export function getYoClient(chainId: SupportedChainId = 8453) {
	let client = clients.get(chainId);
	if (!client) {
		client = createYoClient({ chainId });
		clients.set(chainId, client);
	}
	return client;
}
