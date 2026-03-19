export type ToastType = 'success' | 'error' | 'warn';

interface ToastItem {
	id: number;
	type: ToastType;
	message: string;
}

let items = $state<ToastItem[]>([]);

export const toasts = {
	get items() {
		return items;
	},

	show(type: ToastType, message: string, duration = 3500) {
		if (items.length >= 3) items = items.slice(1);
		const id = Date.now() + Math.floor(Math.random() * 1000);
		items = [...items, { id, type, message }];
		setTimeout(() => {
			items = items.filter((t) => t.id !== id);
		}, duration);
	},

	success(message: string) {
		this.show('success', message);
	},
	error(message: string) {
		this.show('error', message);
	},
	warn(message: string) {
		this.show('warn', message);
	}
};
