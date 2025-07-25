import React from 'react';
import Link from 'next/link';
import { FaTwitter, FaLinkedin, FaTelegram } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500">
                <span className="text-sm font-bold text-white">C</span>
              </div>
              <span className="text-xl font-bold text-white">CoinbitClub</span>
            </div>
            <p className="text-sm text-slate-400">
              Plataforma premium de trading automatizado com IA. Tecnologia de ponta para maximizar seus resultados no mercado de criptomoedas.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Plataforma</h3>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="text-sm text-slate-400 transition-colors hover:text-emerald-400">Dashboard</Link></li>
              <li><Link href="/admin" className="text-sm text-slate-400 transition-colors hover:text-emerald-400">Admin Panel</Link></li>
              <li><Link href="/affiliate" className="text-sm text-slate-400 transition-colors hover:text-emerald-400">Programa de Afiliados</Link></li>
              <li><Link href="/api-docs" className="text-sm text-slate-400 transition-colors hover:text-emerald-400">API</Link></li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Suporte</h3>
            <ul className="space-y-2">
              <li><Link href="/docs" className="text-sm text-slate-400 transition-colors hover:text-emerald-400">Documentação</Link></li>
              <li><Link href="/help" className="text-sm text-slate-400 transition-colors hover:text-emerald-400">Central de Ajuda</Link></li>
              <li><Link href="/contact" className="text-sm text-slate-400 transition-colors hover:text-emerald-400">Contato</Link></li>
              <li><Link href="/status" className="text-sm text-slate-400 transition-colors hover:text-emerald-400">Status da Plataforma</Link></li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-slate-400 transition-colors hover:text-emerald-400">Política de Privacidade</Link></li>
              <li><Link href="/terms" className="text-sm text-slate-400 transition-colors hover:text-emerald-400">Termos de Uso</Link></li>
              <li><Link href="/security" className="text-sm text-slate-400 transition-colors hover:text-emerald-400">Segurança</Link></li>
              <li><Link href="/compliance" className="text-sm text-slate-400 transition-colors hover:text-emerald-400">Compliance</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 flex flex-col items-center justify-between border-t border-slate-800 pt-8 md:flex-row">
          <p className="text-sm text-slate-400">
            © 2025 CoinbitClub. Todos os direitos reservados.
          </p>
          <div className="mt-4 flex items-center space-x-4 md:mt-0">
            <div className="flex space-x-3">
              <a href="#" className="text-slate-400 transition-colors hover:text-emerald-400">
                <span className="sr-only">Twitter</span>
                <FaTwitter />
              </a>
              <a href="#" className="text-slate-400 transition-colors hover:text-emerald-400">
                <span className="sr-only">LinkedIn</span>
                <FaLinkedin />
              </a>
              <a href="#" className="text-slate-400 transition-colors hover:text-emerald-400">
                <span className="sr-only">Telegram</span>
                <FaTelegram />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
