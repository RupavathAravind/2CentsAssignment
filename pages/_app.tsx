import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { BinanceProvider } from '../contexts/BinanceContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <BinanceProvider>
      <Component {...pageProps} />
    </BinanceProvider>
  );
}

