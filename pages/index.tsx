import Head from 'next/head';
import OrderBook from '../components/OrderBook';
import RecentTrades from '../components/RecentTrades';
import DepthVisualizer from '../components/DepthVisualizer';

export default function Home() {
  return (
    <>
      <Head>
        <title>Real-Time Order Book - Binance BTC/USDT</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="container">
        <h1 style={{ margin: '8px 0 16px 0', fontSize: 18 }}>Real-Time Order Book Visualizer</h1>
        <div className="row" style={{ marginBottom: 16 }}>
          <div className="col"><DepthVisualizer /></div>
        </div>
        <div className="row">
          <div className="col"><OrderBook /></div>
          <div className="col" style={{ maxWidth: 420 }}><RecentTrades /></div>
        </div>
      </main>
    </>
  );
}


