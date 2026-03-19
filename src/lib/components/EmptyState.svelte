<script lang="ts">
	import type { Snippet } from 'svelte';

	type EmptyStateProps = {
		icon: Snippet;
		title: string;
		subtitle: string;
	};

	let { icon, title, subtitle }: EmptyStateProps = $props();
</script>

<div class="empty-state">
	<div class="empty-icon">
		{@render icon()}
	</div>
	<div class="empty-title">{title}</div>
	<div class="empty-sub">{subtitle}</div>
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding-top: 160px;
		gap: 14px;
	}
	.empty-icon {
		color: var(--text-dim);
		margin-bottom: 8px;
	}
	.empty-title {
		font-family: var(--font-tight);
		font-size: 20px;
		font-weight: 300;
		letter-spacing: -0.5px;
	}
	.empty-sub {
		font-size: 13px;
		color: var(--text-dim);
		max-width: 260px;
		line-height: 1.5;
	}
</style>
