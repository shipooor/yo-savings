<script lang="ts">
	import '../styles/tokens.css';

	let { children } = $props();
</script>

<div class="app">
	{@render children()}
</div>

<style>
	.app {
		max-width: 430px;
		margin: 0 auto;
		position: relative;
		height: 100%;
	}
</style>
