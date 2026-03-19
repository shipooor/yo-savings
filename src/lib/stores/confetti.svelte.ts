let fireFn: (() => void) | null = null;

export const confettiStore = {
	register(fn: () => void) {
		fireFn = fn;
	},
	fire() {
		fireFn?.();
	}
};
