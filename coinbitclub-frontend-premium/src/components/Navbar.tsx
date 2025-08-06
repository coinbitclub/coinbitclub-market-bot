import React from 'react';
import Link from 'next/link'
import { SunIcon, MoonIcon, BellIcon } from '@radix-ui/react-icons'
import { useTheme } from './ThemeProvider'

export default function Navbar() {
  const { theme, toggle } = useTheme()
  
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-800/50 bg-slate-900/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500">
              <span className="text-sm font-bold text-white">C</span>
            </div>
            <span className="text-xl font-bold text-white">CoinbitClub</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-400">
              PREMIUM
            </span>
          </Link>
          
          {/* Navigation Links */}
          <div className="hidden items-center space-x-8 md:flex">
            <Link 
              href="/dashboard" 
              className="font-medium text-slate-300 transition-colors duration-200 hover:text-emerald-400"
            >
              📊 Dashboard
            </Link>
            <Link 
              href="/admin" 
              className="font-medium text-slate-300 transition-colors duration-200 hover:text-emerald-400"
            >
              ⚙️ Admin
            </Link>
            <Link 
              href="/affiliate" 
              className="font-medium text-slate-300 transition-colors duration-200 hover:text-emerald-400"
            >
              💎 Afiliado
            </Link>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 text-slate-400 transition-colors duration-200 hover:text-emerald-400"
              aria-label="Notifications"
            >
              <BellIcon className="size-5" />
            </button>
            
            <button 
              type="button" 
              onClick={toggle} 
              className="p-2 text-slate-400 transition-colors duration-200 hover:text-emerald-400"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
            </button>
            
            {/* Profile/Login */}
            <div className="flex items-center space-x-2">
              <Link 
                href="/dashboard" 
                className="premium-button px-4 py-2 text-sm font-semibold"
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}


