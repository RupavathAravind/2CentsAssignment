import { useEffect, useRef, useState } from 'react';

type AggTrade = {
  e: 'aggTrade';
  E: number; // event time
  s: string; // symbol
  a: number; // aggregate trade id
  p: string; // price
  q: string; // quantity
  m: boolean; // is buyer the market maker
};

type DepthDelta = {
  e: 'depthUpdate';
  E: number; // event time
  s: string; // symbol
  U?: number; // first update ID in event (not present on combined)
  u?: number; // final update ID in event (not present on combined)
  b: [string, string][]; // bids [price, qty]
  a: [string, string][]; // asks [price, qty]
};

export type TradeTick = {
  id: number;
  price: number;
  qty: number;
  time: number;
  side: 'buy' | 'sell';
};

export type OrderBookDelta = {
  bids: [number, number][];
  asks: [number, number][];
  time: number;
};

type UseBinanceSocketOptions = {
  symbol?: string; // e.g. BTCUSDT
};

export function useBinanceSocket(options?: UseBinanceSocketOptions) {
  const symbol = (options?.symbol ?? 'BTCUSDT').toLowerCase();
  const [connected, setConnected] = useState(false);
  const [lastTrade, setLastTrade] = useState<TradeTick | null>(null);
  const [lastDelta, setLastDelta] = useState<OrderBookDelta | null>(null);
  const [status, setStatus] = useState<string>('initializing');
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<number>(0);
  const rafTradeRef = useRef<number | null>(null);
  const rafDepthRef = useRef<number | null>(null);
  const bufferedTrade = useRef<TradeTick | null>(null);
  const bufferedDepth = useRef<OrderBookDelta | null>(null);
  const endpoints = useRef<string[]>([
    process.env.NEXT_PUBLIC_BINANCE_WS_BASE || 'wss://stream.binance.com:9443/stream',
    'wss://stream.binance.com/stream',
    'wss://stream.binance.com:443/stream',
    'wss://stream.binance.us:9443/stream',
    'wss://stream.binance.us/stream',
    'wss://stream.binance.us:443/stream',
    'wss://fstream.binance.com/stream',
    'wss://testnet.binance.vision/stream'
  ].filter(Boolean));
  const endpointIndexRef = useRef<number>(0);

  useEffect(() => {
    let closed = false;

    function connect() {
      const base = endpoints.current[endpointIndexRef.current % endpoints.current.length];
      const url = `${base}?streams=${symbol}@aggTrade/${symbol}@depth@100ms`;
      setStatus(`connecting: ${url}`);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (closed) return;
        setConnected(true);
        retryRef.current = 0;
        setStatus('connected');
        // eslint-disable-next-line no-console
        console.info('[BinanceWS] connected', url);
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data as string);
          const payload = data?.data ?? data; // combined stream has {stream, data}

          if (payload?.e === 'aggTrade') {
            const t = payload as AggTrade;
            const tick: TradeTick = {
              id: t.a,
              price: Number(t.p),
              qty: Number(t.q),
              time: t.E,
              side: t.m ? 'sell' : 'buy',
            };
            bufferedTrade.current = tick;
            if (rafTradeRef.current == null) {
              rafTradeRef.current = requestAnimationFrame(() => {
                rafTradeRef.current = null;
                if (bufferedTrade.current) setLastTrade(bufferedTrade.current);
              });
            }
          } else if (payload?.e === 'depthUpdate') {
            const d = payload as DepthDelta;
            const delta: OrderBookDelta = {
              bids: (d.b || []).map(([p, q]) => [Number(p), Number(q)]),
              asks: (d.a || []).map(([p, q]) => [Number(p), Number(q)]),
              time: d.E,
            };
            bufferedDepth.current = delta;
            if (rafDepthRef.current == null) {
              rafDepthRef.current = requestAnimationFrame(() => {
                rafDepthRef.current = null;
                if (bufferedDepth.current) setLastDelta(bufferedDepth.current);
              });
            }
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = (err) => {
        setStatus('error');
        // eslint-disable-next-line no-console
        console.warn('[BinanceWS] error', err);
      };

      ws.onclose = (ev) => {
        setConnected(false);
        setStatus(`closed: code=${ev.code} reason=${ev.reason || 'n/a'}`);
        // eslint-disable-next-line no-console
        console.warn('[BinanceWS] closed', ev.code, ev.reason);
        if (closed) return;
        const retry = Math.min(10000, 500 * Math.pow(2, retryRef.current++));
        if (retryRef.current % 3 === 0) {
          endpointIndexRef.current += 1; // try next endpoint occasionally
        }
        setTimeout(connect, retry);
      };
    }

    connect();

    return () => {
      closed = true;
      if (rafTradeRef.current) cancelAnimationFrame(rafTradeRef.current);
      if (rafDepthRef.current) cancelAnimationFrame(rafDepthRef.current);
      wsRef.current?.close();
    };
  }, [symbol]);

  return { connected, lastTrade, lastDelta, status };
}


