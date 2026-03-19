const FPS = 20;

// Core state — starts at zero, populated when wallet connects
let balance = $state(0);
let eps = $state(0);
let todayEarned = $state(0);
let totalEarned = $state(0);

// Derived
let inc = $derived(eps / FPS);
let dailyRate = $derived(eps * 86400);
let rateDisplay = $derived(
	dailyRate >= 100 ? '$' + dailyRate.toFixed(0) + '/day'
	: dailyRate >= 1 ? '$' + dailyRate.toFixed(2) + '/day'
	: dailyRate >= 0.01 ? '$' + dailyRate.toFixed(4) + '/day'
	: '$' + dailyRate.toFixed(2) + '/day'
);
let showDecimals = $derived(balance < 10000);
let showExtraDecimals = $derived(balance < 100);

// Ticker
let tickerInterval: ReturnType<typeof setInterval> | null = null;

function startTicker() {
	if (tickerInterval) clearInterval(tickerInterval);
	tickerInterval = setInterval(() => {
		balance += inc;
		todayEarned += inc;
		totalEarned += inc;
	}, 1000 / FPS);
}

function stopTicker() {
	if (tickerInterval) {
		clearInterval(tickerInterval);
		tickerInterval = null;
	}
}

function seedReal(totalUsd: number, apyWeighted: number, earnedUsd: number) {
	balance = totalUsd;
	const yearlyEarning = totalUsd * (apyWeighted / 100);
	eps = yearlyEarning / (365 * 24 * 3600);
	totalEarned = earnedUsd;
	todayEarned = yearlyEarning / 365;
}

function reset() {
	balance = 0;
	eps = 0;
	todayEarned = 0;
	totalEarned = 0;
}

export const balanceStore = {
	get balance() {
		return balance;
	},
	get eps() {
		return eps;
	},
	get todayEarned() {
		return todayEarned;
	},
	get totalEarned() {
		return totalEarned;
	},
	get inc() {
		return inc;
	},
	get rateDisplay() {
		return rateDisplay;
	},
	get showDecimals() {
		return showDecimals;
	},
	get showExtraDecimals() {
		return showExtraDecimals;
	},
	get fps() {
		return FPS;
	},

	seedReal,
	reset,
	startTicker,
	stopTicker
};
