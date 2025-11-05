# Real-Time Order Book Visualizer (Next.js + TypeScript)

A high-performance, real-time Order Book and Recent Trades visualizer for Binance BTC/USDT using live WebSocket data.

## Getting Started

Prerequisites: Node.js 18+

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build and start production:

```bash
npm run build && npm start
```

Then open `http://localhost:3000`.

## Notes on Design Choices

- State management kept lightweight using component state and refs with Maps for O(1) price-level updates. Batching via requestAnimationFrame reduces re-renders under load.
- WebSocket combined stream connects to `aggTrade` and `depth@100ms` for BTCUSDT. Reconnects with exponential backoff.
- Order Book uses two columns (bids/asks) with proper sorting, cumulative totals, spread, and depth bars for visual weight.
- Trades list shows last 50 ticks and flashes green/red on new entries based on aggressor side (`m` flag in aggTrade).

## Deployment

- Deploy easily on Vercel. Use default Next.js settings. No environment variables required.

---

Minimal comments are included to keep the code readable while focusing on performance and clarity.

