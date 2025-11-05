import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useBinance } from '../contexts/BinanceContext';

type Side = 'bids' | 'asks';

type BookMaps = {
  bids: Map<number, number>;
  asks: Map<number, number>;
};

function applyDelta(book: BookMaps, side: Side, levels: [number, number][]) {
  const map = book[side];
  for (const [price, qty] of levels) {
    if (qty === 0) {
      map.delete(price);
    } else {
      map.set(price, qty);
    }
  }
}

function sortAndCumulate(entries: [number, number][], side: Side, limit = 25) {
  const sorted = entries.sort((a, b) => (side === 'bids' ? b[0] - a[0] : a[0] - b[0]));
  const trimmed = sorted.slice(0, limit);
  const result: { price: number; qty: number; total: number }[] = [];
  let running = 0;
  for (const [price, qty] of trimmed) {
    running += qty;
    result.push({ price, qty, total: running });
  }
  const maxTotal = result.length ? result[result.length - 1].total : 0;
  return { rows: result, maxTotal };
}

export function OrderBook() {
  const { lastDelta } = useBinance();
  const bookRef = useRef<BookMaps>({ bids: new Map(), asks: new Map() });
  const [, forceTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRenderRef = useRef<number>(0);

  useEffect(() => {
    if (!lastDelta) return;
    applyDelta(bookRef.current, 'bids', lastDelta.bids);
    applyDelta(bookRef.current, 'asks', lastDelta.asks);
    const now = Date.now();
    const since = now - lastRenderRef.current;
    if (since >= 100) {
      lastRenderRef.current = now;
      forceTick((v) => v + 1);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        lastRenderRef.current = Date.now();
        forceTick((v) => v + 1);
      }, 100 - since);
    }
  }, [lastDelta]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const bidsData = useMemo(() => {
    const entries = Array.from(bookRef.current.bids.entries());
    return sortAndCumulate(entries, 'bids');
  }, [bookRef.current.bids, lastDelta]);

  const asksData = useMemo(() => {
    const entries = Array.from(bookRef.current.asks.entries());
    return sortAndCumulate(entries, 'asks');
  }, [bookRef.current.asks, lastDelta]);

  const bestBid = bidsData.rows[0]?.price ?? 0;
  const bestAsk = asksData.rows[0]?.price ?? 0;
  const spread = bestAsk && bestBid ? bestAsk - bestBid : 0;

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="title">Order Book (BTC/USDT)</div>
      <div className="row" style={{ alignItems: 'stretch' }}>
        <div className="col">
          <div className="thead">
            <div>Price</div>
            <div>Amount</div>
            <div>Total</div>
          </div>
          <div className="list">
            {bidsData.rows.map((r) => {
              const width = bidsData.maxTotal ? (r.total / bidsData.maxTotal) * 100 : 0;
              return (
                <div key={`b-${r.price}`} className="rowitem">
                  <div className="price-green">{r.price.toFixed(2)}</div>
                  <div>{r.qty.toFixed(6)}</div>
                  <div>{r.total.toFixed(6)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="spread">
          <div>
            <div style={{ textAlign: 'center' }}>Spread</div>
            <div style={{ fontVariantNumeric: 'tabular-nums', color: '#e6edf3' }}>{spread ? spread.toFixed(2) : '-'}</div>
          </div>
        </div>

        <div className="col">
          <div className="thead">
            <div>Price</div>
            <div>Amount</div>
            <div>Total</div>
          </div>
          <div className="list">
            {asksData.rows.map((r) => {
              const width = asksData.maxTotal ? (r.total / asksData.maxTotal) * 100 : 0;
              return (
                <div key={`a-${r.price}`} className="rowitem">
                  <div className="price-red">{r.price.toFixed(2)}</div>
                  <div>{r.qty.toFixed(6)}</div>
                  <div>{r.total.toFixed(6)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderBook;


