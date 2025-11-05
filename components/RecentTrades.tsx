import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TradeTick } from '../hooks/useBinanceSocket';
import { useBinance } from '../contexts/BinanceContext';

export function RecentTrades() {
  const { lastTrade, connected, status } = useBinance();
  const [trades, setTrades] = useState<TradeTick[]>([]);
  const [flashId, setFlashId] = useState<number | null>(null);

  useEffect(() => {
    if (!lastTrade) return;
    setTrades((prev) => {
      // de-dup by id in case of reconnects
      const exists = prev.find((p) => p.id === lastTrade.id);
      const next = exists ? prev : [lastTrade, ...prev];
      return next.slice(0, 50);
    });
    setFlashId(lastTrade.id);
    const t = setTimeout(() => setFlashId(null), 650);
    return () => clearTimeout(t);
  }, [lastTrade]);

  const statusText = useMemo(() => (connected ? 'Live' : `Reconnecting… (${status})`), [connected, status]);

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="title">Recent Trades <span style={{ marginLeft: 8, color: connected ? '#4ade80' : '#f59e0b' }}>• {statusText}</span></div>
      <div className="thead">
        <div>Price</div>
        <div>Amount</div>
        <div>Time</div>
      </div>
      <div className="list">
        {trades.map((t) => (
          <div key={t.id} className={`rowitem ${flashId === t.id ? 'flash' : ''}`}>
            <div className={t.side === 'buy' ? 'price-green' : 'price-red'}>{t.price.toFixed(2)}</div>
            <div>{t.qty.toFixed(6)}</div>
            <div>{new Date(t.time).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentTrades;


