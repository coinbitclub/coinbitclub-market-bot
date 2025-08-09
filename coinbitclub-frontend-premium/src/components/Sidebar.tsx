import React from 'react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  HamburgerMenuIcon, 
  DashboardIcon, 
  GearIcon, 
  PersonIcon,
  BarChartIcon,
  ExitIcon,
  LockClosedIcon
} from '@radix-ui/react-icons';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/dashboard/trading', label: 'Trading', icon: BarChartIcon },
  { href: '/dashboard/portfolio', label: 'Portfolio', icon: PersonIcon },
  { href: '/dashboard/settings', label: 'Configurações', icon: GearIcon },
  { href: '/affiliate', label: 'Afiliados', icon: PersonIcon },
  { href: '/admin', label: 'Admin', icon: LockClosedIcon },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <aside className={`flex flex-col border-r border-blue-900/50 bg-black transition-all duration-300 ${
      open ? 'w-64' : 'w-20'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-pink-900/50 p-4">
        {open && (
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-pink-500 shadow-md shadow-pink-500/30">
              <span className="text-sm font-bold text-black">C</span>
            </div>
            <span className="font-bold text-amber-400 glow-gold">CoinbitClub</span>
          </Link>
        )}
        <button
          type="button"
          className="p-2 text-blue-400 transition-colors hover:text-pink-400"
          onClick={() => setOpen(!open)}
        >
          <HamburgerMenuIcon className="size-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="grow space-y-2 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = router.pathname === item.href || 
                          (item.href !== '/dashboard' && router.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-900/30 text-blue-400 border border-blue-500/50' 
                  : 'text-pink-400 hover:bg-pink-900/20 hover:text-amber-400 hover:border hover:border-pink-500/50'
              } ${!open ? 'justify-center' : ''}`}
            >
              <Icon className="size-5 shrink-0" />
              {open && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Status Section - Client Side Only */}
      <div className="border-t border-blue-900/50 p-4">
        {isClient && open && (
          <div className="space-y-3 rounded-lg bg-black/80 p-4 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-400">Status do Bot</span>
              <div className="flex items-center space-x-1">
                <div className="size-2 animate-pulse rounded-full bg-amber-400"></div>
                <span className="text-sm font-medium text-amber-400 glow-gold-sm">Ativo</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-400">Uptime</span>
              <span className="text-sm font-medium text-pink-400 glow-pink-sm">24h 00m</span>
            </div>
            
            <button className="flex w-full items-center justify-center space-x-2 rounded-lg bg-pink-900/20 border border-pink-500/50 px-3 py-2 text-pink-400 transition-colors hover:bg-pink-500/30">
              <ExitIcon className="size-4" />
              <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}


