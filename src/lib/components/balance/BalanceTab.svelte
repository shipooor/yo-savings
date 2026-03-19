<script lang="ts">
	import { untrack } from 'svelte';
	import { balanceStore } from '$lib/stores/balance.svelte';
	import { wallet, formatAddress } from '$lib/stores/wallet.svelte';
	import { audio } from '$lib/stores/audio.svelte';

	let { visible = true }: { visible?: boolean } = $props();

	let digitElements: (HTMLSpanElement | undefined)[] = Array(9);
	let prevDigits: string[] = [];

	/** Extract 9 digit characters from a balance number */
	function getDigits(n: number): string[] {
		const intStr = Math.floor(n).toString().padStart(5, '0');
		const decStr = (n % 1).toFixed(4).slice(2);
		return [intStr[0], intStr[1], intStr[2], intStr[3], intStr[4], decStr[0], decStr[1], decStr[2], decStr[3]];
	}

	let initialDigits = getDigits(balanceStore.balance);
	let flipInterval: ReturnType<typeof setInterval> | null = null;

	// Control flip animation based on tab visibility.
	// Ticker runs globally (managed by +page.svelte) so MiniBal stays live.
	// Use untrack to avoid re-running the effect on every balance tick.
	$effect(() => {
		if (visible) {
			if (!flipInterval) {
				prevDigits = untrack(() => getDigits(balanceStore.balance));
				flipInterval = setInterval(() => {
					const nd = untrack(() => getDigits(balanceStore.balance));
					const isCalm = untrack(() => balanceStore.eps) < 0.5;

					nd.forEach((ch, i) => {
						if (ch !== prevDigits[i]) {
							const el = digitElements[i];
							if (!el) return;
							el.textContent = ch;
							if (isCalm || i < 3) {
								el.classList.remove('flip', 'lit');
								void el.offsetWidth; // force reflow to restart CSS animation
								el.classList.add('flip');
								if (isCalm) {
									el.classList.add('lit');
									setTimeout(() => el.classList.remove('lit'), i < 5 ? 500 : 150);
								}
							}
						}
					});
					prevDigits = nd;
				}, 1000 / balanceStore.fps);
			}
		} else {
			if (flipInterval) {
				clearInterval(flipInterval);
				flipInterval = null;
			}
		}

		return () => {
			if (flipInterval) {
				clearInterval(flipInterval);
				flipInterval = null;
			}
		};
	});

	function toggleSound() {
		audio.toggle();
	}

	function handleWalletClick() {
		if (wallet.isConnected) {
			wallet.disconnect();
		} else {
			wallet.open();
		}
	}
</script>

<section class="balance-screen">
	<div class="logo">yo</div>
	<button class="snd" class:on={audio.enabled} aria-label="Toggle ambient sound" onclick={toggleSound}>&#9835;</button>
	<button class="wallet-btn" aria-label={wallet.isConnected ? 'Connected wallet' : 'Connect wallet'} onclick={handleWalletClick}>
		{#if wallet.isConnected}
			<span class="wallet-dot"></span>{formatAddress(wallet.address)}
		{:else}
			Connect
		{/if}
	</button>

	{#if wallet.isConnected}
		<div class="bal-area">
			<div class="bal-lbl">Total balance</div>
			<div class="bal-num">
				<span class="sym">$</span>
				<span class="digit-wrap"><span class="digit" bind:this={digitElements[0]}>{initialDigits[0]}</span></span>
				<span class="digit-wrap"><span class="digit" bind:this={digitElements[1]}>{initialDigits[1]}</span></span>
				<span class="sep">,</span>
				<span class="digit-wrap"><span class="digit" bind:this={digitElements[2]}>{initialDigits[2]}</span></span>
				<span class="digit-wrap"><span class="digit" bind:this={digitElements[3]}>{initialDigits[3]}</span></span>
				<span class="digit-wrap"><span class="digit" bind:this={digitElements[4]}>{initialDigits[4]}</span></span>
				<span
					class="dec-part"
					style:opacity={balanceStore.showDecimals ? '1' : '0'}
					style:max-width={balanceStore.showDecimals ? '200px' : '0'}
				>
					<span class="sep">.</span>
					<span class="digit-wrap"><span class="digit" bind:this={digitElements[5]}>{initialDigits[5]}</span></span>
					<span class="digit-wrap"><span class="digit" bind:this={digitElements[6]}>{initialDigits[6]}</span></span>
					<span class="digit-wrap xd" style:display={balanceStore.showExtraDecimals ? 'inline-block' : 'none'}>
						<span class="digit" bind:this={digitElements[7]}>{initialDigits[7]}</span>
					</span>
					<span class="digit-wrap xd" style:display={balanceStore.showExtraDecimals ? 'inline-block' : 'none'}>
						<span class="digit" bind:this={digitElements[8]}>{initialDigits[8]}</span>
					</span>
				</span>
			</div>

			<div class="rate-row">
				<div class="rate"><span class="p">+</span>{balanceStore.rateDisplay}/s</div>
				<div class="dot-sep"></div>
				<div class="today-earn">today <strong>+${balanceStore.todayEarned.toFixed(2)}</strong></div>
			</div>

			<div class="bal-tag">your money never sleeps</div>
		</div>
	{:else}
		<div class="connect-prompt">
			<div class="cp-icon">
				<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="2" y="6" width="20" height="14" rx="2"/>
					<path d="M2 10h20"/>
					<circle cx="16" cy="15" r="2"/>
				</svg>
			</div>
			<div class="cp-title">Connect your wallet</div>
			<div class="cp-sub">View your vault balances and start earning yield</div>
			<button class="cp-btn" onclick={handleWalletClick}>Connect Wallet</button>
		</div>
	{/if}
</section>

<style>
	.balance-screen {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
	}

	/* Logo */
	.logo {
		position: absolute;
		top: 52px;
		font-family: var(--font-serif);
		font-style: italic;
		font-size: 24px;
		color: var(--text-dim);
		opacity: 0;
		animation: fadeIn 1s 0.3s forwards;
	}

	/* Wallet button */
	.wallet-btn {
		position: absolute;
		top: 48px;
		right: 20px;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		color: var(--text-secondary);
		padding: 8px 14px;
		border-radius: 100px;
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 400;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 6px;
		opacity: 0;
		animation: fadeIn 1s 0.5s forwards;
		transition: all 0.2s;
	}
	.wallet-btn:active {
		transform: scale(0.95);
	}

	.wallet-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--green);
		box-shadow: 0 0 8px rgba(79, 206, 104, 0.5);
		animation: pulse 2s ease-in-out infinite;
	}

	/* Sound toggle */
	.snd {
		position: absolute;
		top: 48px;
		left: 20px;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 15px;
		color: var(--text-dim);
		cursor: pointer;
		z-index: 160;
		opacity: 0;
		animation: fadeIn 1s 0.5s forwards;
		transition: all 0.25s;
	}
	.snd:active {
		transform: scale(0.9);
	}
	.snd.on {
		color: var(--gold);
		border-color: rgba(200, 164, 78, 0.2);
		box-shadow: 0 0 12px rgba(200, 164, 78, 0.1);
	}

	/* Balance area */
	.bal-area {
		text-align: center;
		position: relative;
		z-index: 2;
		opacity: 0;
		animation: balReveal 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
	}

	/* Radial glow behind balance */
	.bal-area::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 400px;
		height: 280px;
		background: radial-gradient(
			ellipse,
			rgba(200, 164, 78, 0.06) 0%,
			rgba(200, 164, 78, 0.02) 40%,
			transparent 70%
		);
		pointer-events: none;
		z-index: -1;
		animation: -global-glowPulse 6s ease-in-out infinite;
	}

	.bal-lbl {
		font-size: 11px;
		font-weight: 400;
		color: var(--text-dim);
		letter-spacing: 6px;
		text-transform: uppercase;
		margin-bottom: 16px;
		background: linear-gradient(90deg, var(--text-dim), var(--text-secondary), var(--text-dim));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* Flip digit number display */
	.bal-num {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 0;
		font-family: var(--font-tight);
		font-weight: 300;
		font-size: 64px;
		letter-spacing: -3.5px;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		padding: 0 16px;
	}

	.bal-num .sym {
		font-size: 38px;
		color: var(--text-secondary);
		margin-right: 2px;
		font-weight: 200;
	}

	.digit-wrap {
		display: inline-block;
		position: relative;
	}

	.digit-wrap :global(.digit) {
		display: block;
		transition: color 0.2s;
	}

	.digit-wrap :global(.digit.flip) {
		animation: digitFlip 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.digit-wrap :global(.digit.lit) {
		color: var(--gold);
		text-shadow: 0 0 20px rgba(200, 164, 78, 0.4);
	}

	.dec-part {
		font-size: 34px;
		color: var(--text-dim);
		font-weight: 200;
		transition: opacity 0.5s, max-width 0.5s, margin 0.5s;
	}

	.xd {
		opacity: 0.4;
	}
	.xd :global(.digit) {
		font-size: 38px;
	}

	.sep {
		font-size: 48px;
		color: var(--text-dim);
		font-weight: 200;
	}

	/* Rate row */
	.rate-row {
		margin-top: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 24px;
		opacity: 0;
		animation: fadeIn 1s 0.8s forwards;
	}

	.rate {
		font-family: var(--font-mono);
		font-size: 14px;
		color: var(--text-secondary);
	}
	.rate .p {
		color: var(--green);
	}

	.today-earn {
		font-family: var(--font-mono);
		font-size: 14px;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.today-earn strong {
		color: var(--gold);
		font-weight: 500;
	}

	.dot-sep {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--text-dim);
	}

	/* Tagline */
	.bal-tag {
		margin-top: 48px;
		font-size: 13px;
		color: var(--text-secondary);
		font-family: var(--font-serif);
		font-style: italic;
		letter-spacing: 0.5px;
		opacity: 0;
		animation: fadeIn 1.2s 1.2s forwards;
	}
	.bal-tag::before {
		content: '';
		display: block;
		width: 32px;
		height: 1px;
		margin: 0 auto 12px;
		background: linear-gradient(90deg, transparent, rgba(200, 164, 78, 0.5), transparent);
	}

	/* Connect prompt */
	.connect-prompt {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 16px;
		opacity: 0;
		animation: fadeIn 1s 0.3s forwards;
	}
	.cp-icon {
		color: var(--text-dim);
		margin-bottom: 8px;
	}
	.cp-title {
		font-family: var(--font-tight);
		font-size: 22px;
		font-weight: 300;
		letter-spacing: -0.5px;
	}
	.cp-sub {
		font-size: 13px;
		color: var(--text-dim);
		max-width: 260px;
		line-height: 1.5;
	}
	.cp-btn {
		margin-top: 8px;
		padding: 14px 32px;
		border: none;
		border-radius: 100px;
		background: var(--gold);
		color: var(--bg);
		font-family: var(--font-sans);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		box-shadow: 0 0 24px rgba(200, 164, 78, 0.2);
		transition: all 0.2s;
	}
	.cp-btn:active {
		transform: scale(0.95);
	}

	/* Animations */
	@keyframes fadeIn {
		to {
			opacity: 1;
		}
	}

	@keyframes balReveal {
		0% {
			opacity: 0;
			transform: scale(0.9) translateY(20px);
			filter: blur(10px);
		}
		100% {
			opacity: 1;
			transform: scale(1) translateY(0);
			filter: blur(0);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}

	@keyframes digitFlip {
		0% {
			transform: translateY(30%);
			opacity: 0;
			filter: blur(4px);
		}
		100% {
			transform: translateY(0);
			opacity: 1;
			filter: blur(0);
		}
	}

	/* Responsive */
	@media (max-width: 380px) {
		.bal-num {
			font-size: 48px;
			letter-spacing: -2.5px;
		}
		.bal-num .sym {
			font-size: 30px;
		}
		.dec-part {
			font-size: 28px;
		}
		.sep {
			font-size: 32px;
		}
	}
</style>
