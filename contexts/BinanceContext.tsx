import React, { createContext, useContext } from 'react';
import { useBinanceSocket, TradeTick, OrderBookDelta } from '../hooks/useBinanceSocket';

type BinanceContextType = {
  connected: boolean;
  status: string;
  lastTrade: TradeTick | null;
  lastDelta: OrderBookDelta | null;
};

const BinanceContext = createContext<BinanceContextType | undefined>(undefined);

export function BinanceProvider({ children }: { children: React.ReactNode }) {
  const { connected, status, lastTrade, lastDelta } = useBinanceSocket();
  return (
    <BinanceContext.Provider value={{ connected, status, lastTrade, lastDelta }}>
      {children}
    </BinanceContext.Provider>
  );
}

export function useBinance() {
  const ctx = useContext(BinanceContext);
  if (!ctx) throw new Error('useBinance must be used within BinanceProvider');
  return ctx;
}


