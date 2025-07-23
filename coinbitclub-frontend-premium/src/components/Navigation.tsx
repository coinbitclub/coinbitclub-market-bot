import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface NavigationProps {
  showAdminLinks?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ showAdminLinks = false }) => {
  const router = useRouter();

  const navStyle = {
    background: 'rgba(0, 0, 0, 0.95)',
    backdropFilter: 'blur(20px)',
    borderBottom: '2px solid rgba(255, 215, 0, 0.3)',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '1rem',
    position: 'sticky' as const,
    top: 0,
    zIndex: 1000,
  };

  const logoStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    background: 'linear-gradient(45deg, #FFD700, #FF69B4, #00BFFF)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    textDecoration: 'none',
  };

  const navLinksStyle = {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  };

  const getButtonStyle = (color: string, isActive: boolean = false) => ({
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: `1px solid ${color}`,
    background: isActive 
      ? `linear-gradient(135deg, ${color}20, ${color}40)` 
      : `rgba(0, 0, 0, 0.8)`,
    color: isActive ? '#fff' : color,
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    display: 'inline-block',
    textAlign: 'center' as const,
    minWidth: 'fit-content',
    whiteSpace: 'nowrap' as const,
    boxShadow: isActive ? `0 0 10px ${color}40` : 'none',
  });

  const isActive = (path: string) => router.pathname === path || router.pathname.startsWith(path);

  return (
    <nav style={navStyle}>
      <Link href="/" style={logoStyle}>
        ⚡ CoinBitClub
      </Link>
      
      <div style={navLinksStyle}>
        {/* Links Principais */}
        <Link 
          href="/dashboard" 
          style={getButtonStyle('#FFD700', isActive('/dashboard'))}
        >
          📊 Dashboard
        </Link>
        
        <Link 
          href="/trading" 
          style={getButtonStyle('#00BFFF', isActive('/trading'))}
        >
          💹 Trading
        </Link>
        
        <Link 
          href="/financial/dashboard" 
          style={getButtonStyle('#FF69B4', isActive('/financial'))}
        >
          💰 Financeiro
        </Link>
        
        <Link 
          href="/affiliate" 
          style={getButtonStyle('#FFD700', isActive('/affiliate'))}
        >
          👥 Afiliados
        </Link>
        
        <Link 
          href="/notifications" 
          style={getButtonStyle('#00BFFF', isActive('/notifications'))}
        >
          🔔 Notificações
        </Link>

        {/* Links de Administração (condicionais) */}
        {showAdminLinks && (
          <>
            <div style={{ width: '1px', height: '20px', background: '#333', margin: '0 0.5rem' }} />
            
            <Link 
              href="/admin/dashboard" 
              style={getButtonStyle('#FF69B4', isActive('/admin/dashboard'))}
            >
              ⚙️ Admin
            </Link>
            
            <Link 
              href="/admin/users" 
              style={getButtonStyle('#FFD700', isActive('/admin/users'))}
            >
              👤 Usuários
            </Link>
            
            <Link 
              href="/admin/financial" 
              style={getButtonStyle('#00BFFF', isActive('/admin/financial'))}
            >
              💼 Fin. Admin
            </Link>
            
            <Link 
              href="/admin/accounting" 
              style={getButtonStyle('#FF69B4', isActive('/admin/accounting'))}
            >
              📊 Contabilidade
            </Link>
            
            <Link 
              href="/system/monitoring" 
              style={getButtonStyle('#FFD700', isActive('/system/monitoring'))}
            >
              🖥️ Sistema
            </Link>
          </>
        )}

        {/* Links de Usuário */}
        <div style={{ width: '1px', height: '20px', background: '#333', margin: '0 0.5rem' }} />
        
        <Link 
          href="/settings" 
          style={getButtonStyle('#00BFFF', isActive('/settings'))}
        >
          ⚙️ Config
        </Link>
        
        <Link 
          href="/auth" 
          style={getButtonStyle('#FF69B4', false)}
        >
          🚪 Sair
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;
