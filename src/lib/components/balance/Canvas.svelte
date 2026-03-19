<script lang="ts">
	import { onMount } from 'svelte';

	let { visible = true }: { visible: boolean } = $props();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let W = $state(0);
	let H = $state(0);
	let animId: number;
	let running = false;

	// Terrain config
	const T_ROWS = 30;
	const T_COLS = 25;
	const T_SPEED = 0.0003;

	/** Sine-based noise for terrain height */
	function tNoise(x: number, z: number): number {
		return Math.sin(x * 0.3) * Math.cos(z * 0.2) * 20 + Math.sin(x * 0.7 + z * 0.5) * 8;
	}

	/** Draw the wireframe terrain grid */
	function drawTerrain(t: number): void {
		const horizon = H * 0.58;
		const fov = W * 0.8;
		const camZ = t * T_SPEED;

		ctx.lineWidth = 0.5;

		// Horizontal grid lines
		for (let row = 0; row < T_ROWS; row++) {
			const z = row * 2 + (camZ % 2);
			if (z < 0.5) continue;
			const scale = fov / (z * 40);
			const screenY = horizon + scale * 2;
			if (screenY > H + 10 || screenY < horizon - 5) continue;

			const alpha = Math.max(0, Math.min(0.16, 0.16 * (1 - row / T_ROWS)));
			ctx.strokeStyle = `rgba(200,164,78,${alpha})`;
			ctx.beginPath();
			for (let col = 0; col <= T_COLS; col++) {
				const x = (col - T_COLS / 2) * 3;
				const h = tNoise(x, row + camZ * 20) * scale * 0.15;
				const sx = W / 2 + x * scale;
				const sy = screenY - h;
				if (col === 0) ctx.moveTo(sx, sy);
				else ctx.lineTo(sx, sy);
			}
			ctx.stroke();
		}

		// Vertical grid lines
		for (let col = 0; col <= T_COLS; col++) {
			const x = (col - T_COLS / 2) * 3;
			ctx.strokeStyle = 'rgba(200,164,78,0.04)';
			ctx.beginPath();
			for (let row = 1; row < T_ROWS; row++) {
				const z = row * 2 + (camZ % 2);
				if (z < 0.5) continue;
				const scale = fov / (z * 40);
				const sx = W / 2 + x * scale;
				const h = tNoise(x, row + camZ * 20) * scale * 0.15;
				const sy = horizon + scale * 2 - h;
				if (row === 1) ctx.moveTo(sx, sy);
				else ctx.lineTo(sx, sy);
			}
			ctx.stroke();
		}

		// Horizon glow
		const grad = ctx.createLinearGradient(0, horizon - 40, 0, horizon + 60);
		grad.addColorStop(0, 'transparent');
		grad.addColorStop(0.5, 'rgba(200,164,78,0.05)');
		grad.addColorStop(1, 'transparent');
		ctx.fillStyle = grad;
		ctx.fillRect(0, horizon - 40, W, 100);
	}

	/** Start the animation loop if not already running */
	function startLoop(): void {
		if (running) return;
		running = true;
		animId = requestAnimationFrame(frame);
	}

	/** Stop the animation loop */
	function stopLoop(): void {
		running = false;
		cancelAnimationFrame(animId);
	}

	// React to visibility changes
	$effect(() => {
		if (visible) {
			startLoop();
		} else {
			stopLoop();
		}
	});

	/** Main render loop */
	function frame(t: number): void {
		ctx.clearRect(0, 0, W, H);
		ctx.globalAlpha = 1;

		if (visible) drawTerrain(t);

		animId = requestAnimationFrame(frame);
	}

	function resize(): void {
		if (!canvas) return;
		const dpr = window.devicePixelRatio || 1;
		const w = window.innerWidth;
		const h = window.innerHeight;
		canvas.width = w * dpr;
		canvas.height = h * dpr;
		canvas.style.width = w + 'px';
		canvas.style.height = h + 'px';
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		W = w;
		H = h;
	}

	onMount(() => {
		ctx = canvas.getContext('2d')!;
		resize();
		window.addEventListener('resize', resize);
		startLoop();

		return () => {
			window.removeEventListener('resize', resize);
			stopLoop();
		};
	});
</script>

<canvas bind:this={canvas} class="terrain-canvas"></canvas>

<style>
	.terrain-canvas {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 80;
	}
</style>
