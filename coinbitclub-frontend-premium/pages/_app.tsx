import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import { AuthProvider } from '../src/contexts/AuthContextIntegrated';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Component {...pageProps} />
      </NotificationProvider>
    </AuthProvider>
  );
}