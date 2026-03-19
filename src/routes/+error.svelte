<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="error-page">
	<div class="error-code">{page.status}</div>
	<div class="error-msg">{page.error?.message ?? 'Something went wrong'}</div>
</div>

<style>
	.error-page {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
	}
	.error-code {
		font-family: var(--font-tight);
		font-size: 64px;
		font-weight: 200;
		color: var(--text-dim);
	}
	.error-msg {
		font-size: 14px;
		color: var(--text-secondary);
	}
</style>
