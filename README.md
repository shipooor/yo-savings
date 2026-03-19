# YO Savings

> Your money never sleeps — DeFi savings app for YO Protocol

Aggregated yield vault dashboard that makes earning on ERC-4626 vaults meditative and rewarding. Watch your balance tick up in real-time as your assets generate yield across multiple chains.

## Features

- **Live balance ticker** — Real-time earning display with adaptive precision (adjusts decimal places based on earning rate)
- **6 multichain vaults** — yoUSD, yoETH, yoBTC, yoEUR, yoGOLD, yoUSDT across Base, Ethereum, and Arbitrum
- **Deposit & withdraw** — Seamless ERC-4626 vault interactions with approval flow
- **Dynamic APY display** — Real-time yield rates and earned totals (today, lifetime)
- **Ambient soundscape** — Optional audio that responds to earning rate and user interactions
- **Terrain visualization** — Canvas-based wireframe landscape that shifts with earning intensity
- **Progress tracking** — Milestones, earning streaks, and achievement system
- **Transaction history** — Filterable record of deposits, withdrawals, and yield accrual
- **Mobile-first design** — Fully responsive from 375px phones to desktop

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Svelte 5 + SvelteKit 2 |
| Styling | CSS Variables (custom design system) |
| Wallet | wagmi + viem |
| Protocol | YO Protocol (`@yo-protocol/core`) — ERC-4626 vaults |
| Chains | Base, Ethereum, Arbitrum |
| Audio | Web Audio API |
| Language | TypeScript (strict mode) |

## Getting Started

```bash
git clone https://github.com/shipooor/yo-savings.git
cd yo-savings
pnpm install
cp .env.example .env
# Add your WalletConnect project ID to .env
pnpm dev
```

Visit `http://localhost:5173` and connect your wallet to begin.

## Architecture

- **`src/lib/stores/`** — Svelte 5 runes-based reactive state for balance, vault positions, and UI effects
- **`src/lib/components/`** — Feature-grouped UI components (balance, vaults, progress, history)
- **`src/lib/config/`** — wagmi config (chain setup, connector initialization) and YO SDK client factory
- **`src/styles/tokens.css`** — Centralized design tokens: colors, typography, spacing, shadows
- **`src/routes/+page.svelte`** — Main app shell with tab navigation and canvas rendering

## How It Works

Users connect their wallet (MetaMask, WalletConnect, etc.) and see an aggregated view of their positions across all YO vaults on supported chains. The balance display updates at 20 FPS, ticking up smoothly as yield accrues per second. The UI adapts its intensity based on earning rate: below $0.50/s the interface remains calm and meditative; above $5/s, visual effects intensify to reflect the active earning state.

Deposits route through the YO SDK's ERC-4626 interface with automatic token approval. Withdrawals redeem vault shares for underlying assets. All transactions are tracked with chain, vault, amount, and timestamp in the history tab.

## Design Philosophy

YO Savings prioritizes a premium, meditative experience. The dark theme with gold and green accents creates a calm, sophisticated mood—earning should feel like a peaceful activity, not a stressful one. The terrain canvas provides a visual anchor that shifts subtly based on yield intensity. Ambient audio reinforces the meditative theme, optionally playing soft, generative soundscapes that respond to earning activity.

Number display adapts in real-time: higher precision (up to 4 decimals) for slow earning rates, lower precision for fast rates. This ensures the ticker remains readable and responsive across different vault APYs.

## License

MIT
