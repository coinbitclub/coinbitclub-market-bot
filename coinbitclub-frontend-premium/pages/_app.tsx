import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { NotificationProvider } from '../src/contexts/NotificationContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <NotificationProvider>
      <Component {...pageProps} />
    </NotificationProvider>
  );
}