const FPS = 20;

// Core state — starts at zero, populated when wallet connects
let balance = $state(0);
let eps = $state(0);
let todayEarned = $state(0);
let totalEarned = $state(0);

// Derived
let inc = $derived(eps / FPS);
let rateDisplay = $derived(eps >= 1 ? '$' + eps.toFixed(1) : '$' + eps.toFixed(4));
let showDecimals = $derived(eps < 1);
let showExtraDecimals = $derived(eps < 0.005);

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

	setEps(val: number) {
		eps = val;
	},

	seedReal,
	reset,
	startTicker,
	stopTicker
};
