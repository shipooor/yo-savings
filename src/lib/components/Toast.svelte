<script lang="ts">
	import { toasts } from '$lib/stores/toast.svelte';
</script>

<div class="toast-container" role="status" aria-live="polite">
	{#each toasts.items as toast (toast.id)}
		<div class="toast {toast.type}">{toast.message}</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		top: calc(60px + env(safe-area-inset-top));
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		gap: 8px;
		z-index: 450;
		pointer-events: none;
		width: calc(100% - 40px);
		max-width: 380px;
	}
	.toast {
		padding: 14px 18px;
		border-radius: 12px;
		font-size: 13px;
		font-weight: 400;
		pointer-events: auto;
	}
	.toast.error {
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.25);
		color: #f87171;
	}
	.toast.success {
		background: rgba(79, 206, 104, 0.12);
		border: 1px solid rgba(79, 206, 104, 0.2);
		color: var(--green);
	}
	.toast.warn {
		background: rgba(200, 164, 78, 0.12);
		border: 1px solid rgba(200, 164, 78, 0.2);
		color: var(--gold-light);
	}
</style>
