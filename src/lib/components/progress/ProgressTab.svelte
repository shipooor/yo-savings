<script lang="ts">
	import { wallet } from '$lib/stores/wallet.svelte';
	import { vaultStore } from '$lib/stores/vaults.svelte';
	import { balanceStore } from '$lib/stores/balance.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';

	// Milestones thresholds
	const GOALS = [1, 10, 100, 500, 1000, 5000, 10000];

	type Milestone = {
		title: string;
		value: string;
		state: 'done' | 'cur' | 'lock';
		progress?: number;
	};

	let totalEarned = $derived(vaultStore.totalEarned);

	// Find the next goal
	let nextGoal = $derived(GOALS.find((g) => g > totalEarned) ?? GOALS[GOALS.length - 1]);
	let toGo = $derived(Math.max(0, nextGoal - totalEarned));
	let progress = $derived(nextGoal > 0 ? Math.min(totalEarned / nextGoal, 1) : 0);

	// SVG arc calculation
	const radius = 72;
	const circumference = 2 * Math.PI * radius;
	let offset = $derived(circumference * (1 - progress));

	// Build milestones from real data
	let milestones = $derived.by(() => {
		const ms: Milestone[] = [];
		// First deposit milestone
		const hasDeposits = vaultStore.vaults.some((v) => v.depositedRaw > 0n);
		ms.push({
			title: 'First deposit',
			value: hasDeposits ? 'Done' : '',
			state: hasDeposits ? 'done' : 'lock',
		});

		for (const goal of GOALS) {
			if (totalEarned >= goal) {
				ms.push({ title: `$${goal.toLocaleString()}`, value: 'Done', state: 'done' });
			} else if (goal === nextGoal) {
				const pct = Math.round((totalEarned / goal) * 100);
				ms.push({ title: `$${goal.toLocaleString()}`, value: `${pct}%`, state: 'cur', progress: totalEarned / goal });
			} else {
				ms.push({ title: `$${goal.toLocaleString()}`, value: '', state: 'lock' });
			}
		}

		// Sort: done first (reversed), then cur, then lock
		const done = ms.filter((m) => m.state === 'done').reverse();
		const cur = ms.filter((m) => m.state === 'cur');
		const lock = ms.filter((m) => m.state === 'lock');
		return [...cur, ...done, ...lock];
	});

	// Weekly earnings estimate from daily rate
	let dailyEst = $derived(balanceStore.eps * 86400);
	let weeklyData = $derived(Array.from({ length: 7 }, () => dailyEst));
	let weeklyTotal = $derived(dailyEst * 7);
	const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	let todayIndex = $derived(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);

	// Generate SVG sparkline path
	const svgW = 340;
	const svgH = 48;
	const padding = 4;
	const maxVal = Math.max(...weeklyData, 0.001) * 1.15;

	function getPoint(i: number): { x: number; y: number } {
		const x = padding + (i / (weeklyData.length - 1)) * (svgW - padding * 2);
		const y = svgH - padding - ((weeklyData[i] / maxVal) * (svgH - padding * 2));
		return { x, y };
	}

	// Build polyline points string
	const linePoints = weeklyData.map((_, i) => {
		const p = getPoint(i);
		return `${p.x},${p.y}`;
	}).join(' ');

	// Build area path (filled under the line)
	const firstPt = getPoint(0);
	const lastPt = getPoint(weeklyData.length - 1);
	const areaPath = `M${firstPt.x},${firstPt.y} ` +
		weeklyData.map((_, i) => {
			const p = getPoint(i);
			return `L${p.x},${p.y}`;
		}).join(' ') +
		` L${lastPt.x},${svgH} L${firstPt.x},${svgH} Z`;

	// Last point for the dot
	const dotPt = getPoint(weeklyData.length - 1);

	// Streak — show as active if user has deposits
	let hasActiveDeposits = $derived(vaultStore.vaults.some((v) => v.depositedRaw > 0n));
	let streakDays = $derived(hasActiveDeposits ? 1 : 0);
	const streakDotsTotal = 7;
	let streakDots = $derived(
		Array.from({ length: streakDotsTotal }, (_, i): 'on' | 'off' | 'now' => {
			if (!hasActiveDeposits) return 'off';
			if (i === streakDotsTotal - 1) return 'now';
			return 'off';
		})
	);
</script>

{#if !wallet.isConnected}
<section class="progress-screen">
	<EmptyState title="Your progress" subtitle="Connect your wallet to track milestones, streaks, and earning history">
		{#snippet icon()}
			<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M12 3v18M3 12l4-4 3 3 4-6 4 4 3-2"/>
			</svg>
		{/snippet}
	</EmptyState>
</section>
{:else}
<section class="progress-screen">
	<div class="p-hero">
		<div class="arc-wrap">
			<svg class="arc-svg" viewBox="0 0 180 180">
				<defs>
					<linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="var(--gold)" />
						<stop offset="100%" stop-color="var(--gold-light)" />
					</linearGradient>
				</defs>
				<circle class="arc-bg" cx="90" cy="90" r="72" />
				<circle
					class="arc-fg"
					cx="90"
					cy="90"
					r="72"
					style="stroke-dasharray: {circumference}; stroke-dashoffset: {offset}"
				/>
			</svg>
			<div class="arc-center">
				<div class="arc-pct"><span>$</span><span>{totalEarned > 0 ? Math.floor(totalEarned).toLocaleString() : '0'}</span></div>
				<div class="arc-sub">total earned</div>
			</div>
		</div>
		<div class="p-goal"><span class="p-goal-amt">${toGo} to go</span> · next ${nextGoal}</div>
	</div>

	<!-- Journey milestones -->
	<div class="journey">
		{#each milestones as ms}
			<div class="j-node {ms.state}">
				<div class="j-dot"></div>
				<div class="j-row">
					<span class="j-title">{ms.title}</span>
					<span class="j-val">{ms.value}</span>
				</div>
				{#if ms.state === 'cur' && ms.progress !== undefined}
					<div class="j-bar">
						<div class="j-fill" style="width: {ms.progress * 100}%"></div>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Weekly sparkline -->
	<div class="weekly">
		<div class="weekly-header">
			<span class="weekly-title">This week</span>
			<span class="weekly-value">+${weeklyTotal.toFixed(2)}</span>
		</div>
		<div class="wk-line">
			<svg viewBox="0 0 {svgW} {svgH}" preserveAspectRatio="none">
				<defs>
					<linearGradient id="wkGrad" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="var(--gold)" stop-opacity="0.3" />
						<stop offset="100%" stop-color="var(--gold)" stop-opacity="0" />
					</linearGradient>
				</defs>
				<path class="wk-area" d={areaPath} />
				<polyline class="wk-stroke" points={linePoints} />
				<circle class="wk-dot" cx={dotPt.x} cy={dotPt.y} r="3" />
			</svg>
		</div>
		<div class="wk-labels">
			{#each weekLabels as label, i}
				<span class:now={i === todayIndex}>{label}</span>
			{/each}
		</div>
	</div>

	<!-- Streak -->
	<div class="streak-row">
		<div class="streak-left">
			<svg class="streak-fire" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
				<path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>
			</svg>
			<span class="streak-num">{streakDays}</span>
			<span class="streak-label">earning streak</span>
		</div>
		<div class="streak-dots">
			{#each streakDots as dot}
				<div class="streak-dot" class:on={dot === 'on'} class:now={dot === 'now'}></div>
			{/each}
		</div>
	</div>
</section>
{/if}

<style>
	.progress-screen {
		padding: 0 24px;
		padding-bottom: 90px;
	}

	/* Hero arc */
	.p-hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 60px 0 48px;
		position: relative;
	}
	.p-hero::before {
		content: '';
		position: absolute;
		top: 40px;
		left: 50%;
		transform: translateX(-50%);
		width: 320px;
		height: 320px;
		background: radial-gradient(circle, rgba(200, 164, 78, 0.06) 0%, transparent 60%);
		pointer-events: none;
		animation: -global-glowPulse 6s ease-in-out infinite;
	}
	.arc-wrap {
		position: relative;
		width: 200px;
		height: 200px;
		margin-bottom: 24px;
	}
	.arc-svg {
		width: 100%;
		height: 100%;
		transform: rotate(-90deg);
	}
	.arc-bg {
		fill: none;
		stroke: rgba(255, 255, 255, 0.04);
		stroke-width: 1.5;
		stroke-linecap: round;
	}
	.arc-fg {
		fill: none;
		stroke: url(#arcGrad);
		stroke-width: 3;
		stroke-linecap: round;
		transition: stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1);
		filter: drop-shadow(0 0 12px rgba(200, 164, 78, 0.35))
			drop-shadow(0 0 28px rgba(200, 164, 78, 0.1));
	}
	.arc-center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.arc-pct {
		font-family: var(--font-tight);
		font-size: 48px;
		font-weight: 200;
		letter-spacing: -2px;
		display: flex;
		align-items: baseline;
		justify-content: center;
	}
	.arc-pct span:first-child {
		font-size: 0.5em;
		color: var(--text-dim);
		margin-right: 2px;
		font-weight: 200;
	}
	.arc-pct span:last-child {
		color: var(--gold);
		text-shadow: 0 0 30px rgba(200, 164, 78, 0.2);
	}
	.arc-sub {
		font-size: 9px;
		color: var(--text-dim);
		margin-top: 4px;
		letter-spacing: 2px;
		text-transform: uppercase;
	}
	.p-goal {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-dim);
		letter-spacing: 0.5px;
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.p-goal-amt {
		color: var(--gold);
	}

	/* Journey */
	.journey {
		position: relative;
		padding: 0 0 0 16px;
		margin-top: 8px;
	}
	.journey::before {
		content: '';
		position: absolute;
		left: 2.5px;
		top: 6px;
		bottom: 6px;
		width: 1px;
		background: linear-gradient(
			to bottom,
			rgba(200, 164, 78, 0.3) 0%,
			rgba(200, 164, 78, 0.08) 60%,
			rgba(255, 255, 255, 0.02) 100%
		);
	}
	.j-node {
		position: relative;
		padding: 0 0 24px 0;
	}
	.j-node:last-child {
		padding-bottom: 0;
	}
	.j-dot {
		position: absolute;
		left: -16px;
		top: 5px;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		border: none;
		background: var(--border);
		transition: all 0.3s;
	}
	.j-node.done .j-dot {
		background: var(--gold);
		box-shadow: 0 0 6px rgba(200, 164, 78, 0.25);
	}
	.j-node.cur .j-dot {
		background: var(--gold);
		box-shadow: 0 0 10px rgba(200, 164, 78, 0.5);
		animation: -global-dotPulse 3s ease-in-out infinite;
	}
	.j-node.lock .j-dot {
		opacity: 0.2;
	}
	.j-node.done .j-title {
		color: var(--text-secondary);
	}
	.j-node.lock .j-title {
		color: var(--text-dim);
		font-weight: 300;
	}
	.j-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.j-title {
		font-size: 13px;
		font-weight: 400;
		letter-spacing: -0.1px;
	}
	.j-val {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-dim);
		letter-spacing: 0.5px;
	}
	.j-node.done .j-val {
		color: var(--gold);
	}
	.j-bar {
		height: 2px;
		background: rgba(255, 255, 255, 0.04);
		border-radius: 1px;
		margin-top: 6px;
		overflow: hidden;
	}
	.j-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--gold), var(--gold-light));
		border-radius: 1px;
		box-shadow: 0 0 8px rgba(200, 164, 78, 0.25);
	}

	/* Weekly */
	.weekly {
		margin-top: 36px;
		padding: 0;
	}
	.weekly-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 12px;
	}
	.weekly-title {
		font-size: 10px;
		color: var(--text-dim);
		font-weight: 300;
		letter-spacing: 2px;
		text-transform: uppercase;
	}
	.weekly-value {
		font-family: var(--font-tight);
		font-size: 14px;
		color: var(--gold);
		font-weight: 400;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.3px;
	}
	.wk-line {
		position: relative;
		height: 48px;
	}
	.wk-line :global(svg) {
		width: 100%;
		height: 100%;
	}
	.wk-area {
		fill: url(#wkGrad);
		opacity: 0.1;
	}
	.wk-stroke {
		fill: none;
		stroke: var(--gold);
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
		filter: drop-shadow(0 0 4px rgba(200, 164, 78, 0.2));
	}
	.wk-dot {
		fill: var(--gold);
		filter: drop-shadow(0 0 6px rgba(200, 164, 78, 0.5));
	}
	.wk-labels {
		display: flex;
		justify-content: space-between;
		margin-top: 6px;
	}
	.wk-labels span {
		font-size: 9px;
		color: var(--text-dim);
		font-weight: 300;
	}
	.wk-labels span.now {
		color: var(--gold);
		font-weight: 400;
	}

	/* Streak */
	.streak-row {
		margin-top: 28px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: 0;
		position: relative;
	}
	.streak-left {
		display: flex;
		align-items: baseline;
		gap: 6px;
	}
	.streak-fire {
		color: var(--gold);
		filter: drop-shadow(0 0 4px rgba(200, 164, 78, 0.3));
	}
	.streak-num {
		font-family: var(--font-tight);
		font-size: 20px;
		font-weight: 300;
		color: var(--gold);
		letter-spacing: -0.5px;
	}
	.streak-label {
		font-size: 12px;
		color: var(--text-dim);
		font-weight: 300;
	}
	.streak-dots {
		display: flex;
		gap: 5px;
	}
	.streak-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.05);
		transition: all 0.3s;
	}
	.streak-dot.on {
		background: var(--gold);
		box-shadow: 0 0 3px rgba(200, 164, 78, 0.2);
	}
	.streak-dot.now {
		background: var(--gold);
		box-shadow: 0 0 8px rgba(200, 164, 78, 0.4);
	}

</style>
