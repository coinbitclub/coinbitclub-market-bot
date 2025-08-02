import React from 'react';
import { ReactNode, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function Layout({ 
  children, 
  title = 'CoinBitClub MarketBot',
  description = 'Sistema de Trading Automatizado com IA'
}: LayoutProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    return router.pathname === path ? 'text-emerald-400 font-medium' : 'text-slate-300 hover:text-white';
  };
  
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-slate-900 text-white">
        {/* Navigation Bar */}
        <nav className="border-b border-slate-700 bg-slate-800/90 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center space-x-8">
                <Link href="/" className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  CoinBitClub
                </Link>
                <div className="hidden space-x-6 md:flex">
                  <Link 
                    href="/dashboard" 
                    className={`transition-colors ${isActive('/dashboard')}`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/trading" 
                    className={`transition-colors ${isActive('/trading')}`}
                  >
                    Trading
                  </Link>
                  <Link 
                    href="/signals" 
                    className={`transition-colors ${isActive('/signals')}`}
                  >
                    Sinais
                  </Link>
                  <Link 
                    href="/affiliate" 
                    className={`transition-colors ${isActive('/affiliate')}`}
                  >
                    Afiliados
                  </Link>
                </div>
              </div>
              
              <div className="hidden md:flex items-center space-x-4">
                <button className="relative p-2 text-slate-300 transition-colors hover:text-white hover:bg-slate-700/50 rounded-full">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center size-4 text-xs font-bold leading-none text-white bg-emerald-500 rounded-full">3</span>
                </button>
                <Link 
                  href="/settings" 
                  className="p-2 text-slate-300 transition-colors hover:text-white hover:bg-slate-700/50 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
                <div className="flex items-center justify-center size-9 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 cursor-pointer">
                  <span className="text-sm font-medium">JD</span>
                </div>
              </div>
              
              {/* Mobile menu button */}
              <div className="md:hidden">
                <button 
                  className="text-slate-300 hover:text-white"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-700 bg-slate-800">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link 
                  href="/dashboard" 
                  className={`block px-3 py-2 rounded-md ${isActive('/dashboard')}`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/trading" 
                  className={`block px-3 py-2 rounded-md ${isActive('/trading')}`}
                >
                  Trading
                </Link>
                <Link 
                  href="/signals" 
                  className={`block px-3 py-2 rounded-md ${isActive('/signals')}`}
                >
                  Sinais
                </Link>
                <Link 
                  href="/affiliate" 
                  className={`block px-3 py-2 rounded-md ${isActive('/affiliate')}`}
                >
                  Afiliados
                </Link>
                <Link 
                  href="/settings" 
                  className={`block px-3 py-2 rounded-md ${isActive('/settings')}`}
                >
                  Configurações
                </Link>
              </div>
              <div className="pt-4 pb-3 border-t border-slate-700">
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center size-9 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500">
                      <span className="text-sm font-medium">JD</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">John Doe</div>
                    <div className="text-sm font-medium text-slate-400">john@example.com</div>
                  </div>
                  <button className="ml-auto p-2 text-slate-300 transition-colors hover:text-white hover:bg-slate-700/50 rounded-full">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-900 py-6">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} CoinBitClub MarketBot. Todos os direitos reservados.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Trading envolve risco significativo. Resultados passados não garantem resultados futuros.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}


