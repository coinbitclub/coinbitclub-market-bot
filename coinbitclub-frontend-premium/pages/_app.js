import '../styles/globals.css';
import { AuthProvider } from '../hooks/useAuth';

// Configuração do App principal com AuthProvider
function CoinBitClubApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default CoinBitClubApp;
