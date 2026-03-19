<script lang="ts">
	import { confettiStore } from '$lib/stores/confetti.svelte';

	interface ConfettiPiece {
		id: number;
		color: string;
		left: string;
		top: string;
		width: string;
		height: string;
		borderRadius: string;
		dx: string;
		dy: string;
		rot: string;
		dur: string;
		active: boolean;
	}

	const COLORS = ['#c8a44e', '#dfc162', '#4fce68', '#ededed', '#ff6b6b', '#6bc5ff'];
	const PARTICLE_COUNT = 60;

	let pieces = $state<ConfettiPiece[]>([]);

	let idCounter = 0;

	function fire(): void {
		const cx = window.innerWidth / 2;

		const newPieces: ConfettiPiece[] = [];

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			newPieces.push({
				id: ++idCounter,
				color: COLORS[Math.floor(Math.random() * COLORS.length)],
				left: cx + 'px',
				top: '40%',
				width: (4 + Math.random() * 6) + 'px',
				height: (6 + Math.random() * 10) + 'px',
				borderRadius: Math.random() > 0.5 ? '50%' : '1px',
				dx: (Math.random() - 0.5) * 300 + 'px',
				dy: (Math.random() - 0.8) * 400 + 'px',
				rot: (Math.random() * 720 - 360) + 'deg',
				dur: (0.6 + Math.random() * 0.8) + 's',
				active: false,
			});
		}

		pieces = [...pieces, ...newPieces];

		requestAnimationFrame(() => {
			pieces = pieces.map((p) =>
				newPieces.some((np) => np.id === p.id) ? { ...p, active: true } : p
			);
		});

		setTimeout(() => {
			const ids = new Set(newPieces.map((p) => p.id));
			pieces = pieces.filter((p) => !ids.has(p.id));
		}, 2000);
	}

	// Register with bridge store
	confettiStore.register(fire);
</script>

<div class="confetti-wrap" class:go={pieces.length > 0}>
	{#each pieces as piece (piece.id)}
		<div
			class="conf"
			class:go={piece.active}
			style="
				background: {piece.color};
				left: {piece.left};
				top: {piece.top};
				width: {piece.width};
				height: {piece.height};
				border-radius: {piece.borderRadius};
				--dx: {piece.dx};
				--dy: {piece.dy};
				--rot: {piece.rot};
				--dur: {piece.dur};
			"
		></div>
	{/each}
</div>

<style>
	.confetti-wrap {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 250;
		display: none;
	}
	.confetti-wrap.go {
		display: block;
	}
	.conf {
		position: absolute;
		width: 6px;
		height: 10px;
		border-radius: 1px;
		opacity: 0.9;
	}
	.conf.go {
		animation: confFall var(--dur) cubic-bezier(0.17, 0.67, 0.35, 0.98) forwards;
	}
	@keyframes confFall {
		0% {
			transform: translate(0, 0) rotate(0deg) scale(1);
			opacity: 1;
		}
		100% {
			transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(0.3);
			opacity: 0;
		}
	}
</style>
