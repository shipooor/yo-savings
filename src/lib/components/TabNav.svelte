<script lang="ts">
	type Tab = 'balance' | 'vaults' | 'progress' | 'history';

	let { activeTab = $bindable() }: { activeTab: Tab } = $props();

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'balance', label: 'Balance' },
		{ id: 'vaults', label: 'Vaults' },
		{ id: 'progress', label: 'Progress' },
		{ id: 'history', label: 'History' },
	];
</script>

<nav class="nav" role="tablist">
	{#each tabs as tab}
		<button
			class="nav-btn"
			class:active={activeTab === tab.id}
			role="tab"
			aria-label="{tab.label} tab"
			aria-selected={activeTab === tab.id}
			onclick={() => (activeTab = tab.id)}
		>
			<svg viewBox="0 0 24 24">
				{#if tab.id === 'balance'}
					<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>
				{:else if tab.id === 'vaults'}
					<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
				{:else if tab.id === 'progress'}
					<path d="M12 3v18M3 12l4-4 3 3 4-6 4 4 3-2"/>
				{:else if tab.id === 'history'}
					<circle cx="12" cy="12" r="9"/><polyline points="12,7 12,12 16,14"/>
				{/if}
			</svg>
			{tab.label}
		</button>
	{/each}
</nav>

<style>
	.nav {
		position: fixed;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		max-width: 430px;
		padding: 8px 20px calc(8px + env(safe-area-inset-bottom));
		display: flex;
		justify-content: space-around;
		background: rgba(5, 5, 7, 0.94);
		backdrop-filter: blur(40px);
		-webkit-backdrop-filter: blur(40px);
		border-top: 1px solid rgba(255, 255, 255, 0.07);
		z-index: 200;
	}
	.nav-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		background: none;
		border: none;
		color: var(--text-dim);
		font-family: var(--font-sans);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.5px;
		cursor: pointer;
		padding: 10px 16px;
		min-width: 56px;
		min-height: 44px;
		transition: all 0.25s;
		position: relative;
		-webkit-tap-highlight-color: transparent;
	}
	.nav-btn:active {
		transform: scale(0.9);
	}
	.nav-btn.active {
		color: var(--gold);
	}
	.nav-btn.active::before {
		content: '';
		position: absolute;
		top: 0;
		width: 20px;
		height: 2px;
		background: var(--gold);
		border-radius: 0 0 2px 2px;
		box-shadow: 0 2px 12px rgba(200, 164, 78, 0.4);
	}
	.nav-btn svg {
		width: 22px;
		height: 22px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
		transition: all 0.25s;
	}
	.nav-btn.active svg {
		filter: drop-shadow(0 0 6px rgba(200, 164, 78, 0.3));
		stroke-width: 2;
	}
</style>
