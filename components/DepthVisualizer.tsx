import React, { useEffect, useMemo, useRef, useState } from 'react';
import { OrderBookDelta } from '../hooks/useBinanceSocket';
import { useBinance } from '../contexts/BinanceContext';

type BookMaps = {
  bids: Map<number, number>;
  asks: Map<number, number>;
};

function applyDelta(book: BookMaps, side: 'bids' | 'asks', levels: [number, number][]) {
  const map = book[side];
  for (const [price, qty] of levels) {
    if (qty === 0) map.delete(price);
    else map.set(price, qty);
  }
}

function buildDepth(book: BookMaps) {
  const bids = Array.from(book.bids.entries()).sort((a, b) => b[0] - a[0]).slice(0, 25);
  const asks = Array.from(book.asks.entries()).sort((a, b) => a[0] - b[0]).slice(0, 25);
  const bidCum: number[] = [];
  const askCum: number[] = [];
  let r = 0;
  for (const [, q] of bids) { r += q; bidCum.push(r); }
  r = 0;
  for (const [, q] of asks) { r += q; askCum.push(r); }
  const max = Math.max(bidCum[bidCum.length - 1] || 0, askCum[askCum.length - 1] || 0) || 1;
  return { bids, asks, bidCum, askCum, max };
}

export default function DepthVisualizer() {
  const { lastDelta } = useBinance();
  const bookRef = useRef<BookMaps>({ bids: new Map(), asks: new Map() });
  const [, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRenderRef = useRef<number>(0);

  useEffect(() => {
    if (!lastDelta) return;
    applyDelta(bookRef.current, 'bids', lastDelta.bids);
    applyDelta(bookRef.current, 'asks', lastDelta.asks);
    const now = Date.now();
    const since = now - lastRenderRef.current;
    if (since >= 120) {
      lastRenderRef.current = now;
      setTick((v) => v + 1);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        lastRenderRef.current = Date.now();
        setTick((v) => v + 1);
      }, 120 - since);
    }
  }, [lastDelta]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const depth = useMemo(() => buildDepth(bookRef.current), [lastDelta]);

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="title">Depth</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 2 }}>
          {depth.bids.map(([, _q], i) => {
            const w = (depth.bidCum[i] / depth.max) * 100;
            return (
              <div key={`db-${i}`} style={{ height: 6, background: '#0f1620', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${w}%`, height: '100%', background: '#16a34a', transition: 'width 200ms ease' }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {depth.asks.map(([, _q], i) => {
            const w = (depth.askCum[i] / depth.max) * 100;
            return (
              <div key={`da-${i}`} style={{ height: 6, background: '#0f1620', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${w}%`, height: '100%', background: '#ef4444', transition: 'width 200ms ease' }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


