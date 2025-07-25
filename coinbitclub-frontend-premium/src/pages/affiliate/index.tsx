import React from 'react';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ShareIcon,
  QrCodeIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import QRCode from 'qrcode.react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Sidebar from '../../components/Sidebar';

// Dados de exemplo
const mockAffiliateStats = {
  totalReferrals: 42,
  activeReferrals: 28,
  totalCommissions: 1542.75,
  monthlyCommissions: 425.32,
  conversionRate: 65,
  tier: 'Diamante',
};

const mockReferrals = [
  {
    id: '1',
    username: 'trader123',
    email: 'trader123@example.com',
    joinDate: '2023-10-15',
    status: 'ACTIVE',
    totalDeposits: 1200,
    commissionGenerated: 120,
    lastActivity: '2023-11-28',
  },
  {
    id: '2',
    username: 'crypto_lover',
    email: 'crypto@example.com',
    joinDate: '2023-09-22',
    status: 'ACTIVE',
    totalDeposits: 750,
    commissionGenerated: 75,
    lastActivity: '2023-11-25',
  },
  {
    id: '3',
    username: 'btc_holder',
    email: 'btc@example.com',
    joinDate: '2023-11-05',
    status: 'INACTIVE',
    totalDeposits: 300,
    commissionGenerated: 30,
    lastActivity: '2023-11-10',
  },
];

export default function AffiliatePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  const referralLink = 'https://coinbitclub.com/ref/YOUR_CODE';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Head>
        <title>Programa de Afiliados - CoinBitClub</title>
      </Head>
      <div className="flex min-h-screen bg-black text-white">
        <Sidebar />
        
        <main className="flex-1 overflow-auto p-6 lg:p-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-amber-400 glow-gold">Programa de Afiliados</h1>
              <p className="text-blue-400 glow-blue">Compartilhe e ganhe comissões.</p>
            </div>
          </div>

          {/* Estatísticas Principais */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-black border border-amber-400 rounded-lg p-5 shadow-lg hover:shadow-amber-400/20 transition-all duration-300">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-full bg-amber-500/10 p-3">
                  <UserGroupIcon className="h-6 w-6 text-amber-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-blue-400">Total de Referidos</p>
                  <p className="text-2xl font-bold text-amber-400 glow-gold">{mockAffiliateStats.totalReferrals}</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-black border border-pink-500 rounded-lg p-5 shadow-lg hover:shadow-pink-400/20 transition-all duration-300">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-full bg-pink-500/10 p-3">
                  <CurrencyDollarIcon className="h-6 w-6 text-pink-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-blue-400">Comissões Totais</p>
                  <p className="text-2xl font-bold text-pink-400 glow-pink">${mockAffiliateStats.totalCommissions.toFixed(2)}</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-black border border-blue-500 rounded-lg p-5 shadow-lg hover:shadow-blue-400/20 transition-all duration-300">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-full bg-blue-500/10 p-3">
                  <SparklesIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-amber-400">Taxa de Conversão</p>
                  <p className="text-2xl font-bold text-blue-400 glow-blue">{mockAffiliateStats.conversionRate}%</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-black border border-amber-400 rounded-lg p-5 shadow-lg hover:shadow-amber-400/20 transition-all duration-300">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-full bg-amber-500/10 p-3">
                  <ShareIcon className="h-6 w-6 text-amber-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-pink-400">Seu Nível</p>
                  <p className="text-2xl font-bold text-amber-400 glow-gold">{mockAffiliateStats.tier}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Link de Referência */}
          <div className="mb-8">
            <Card className="bg-black border border-pink-500 rounded-lg p-5 shadow-lg hover:shadow-pink-400/20 transition-all duration-300">
              <h3 className="mb-4 text-xl font-semibold text-pink-500 glow-pink">Seu Link de Referência</h3>
              <div className="mb-4 flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center rounded-lg border border-blue-500/30 bg-black/30 px-4 py-2">
                    <input
                      type="text"
                      value={referralLink}
                      readOnly
                      className="flex-1 bg-transparent text-blue-400 focus:outline-none"
                    / />
                    <button
                      onClick={copyToClipboard}
                      className="ml-2 rounded-md p-2 text-amber-400 hover:text-amber-300 focus:outline-none"
                    >
                      {copied ? (
                        <CheckIcon className="h-5 w-5" />
                      ) : (
                        <ClipboardDocumentIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="accent" className="flex items-center space-x-2">
                    <ShareIcon className="h-4 w-4" />
                    <span>Compartilhar</span>
                  </Button>
                  <Button variant="secondary" className="flex items-center space-x-2">
                    <QrCodeIcon className="h-4 w-4" />
                    <span>QR Code</span>
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-center rounded-lg border border-blue-500/30 bg-black/30 p-6">
                <QRCode value={referralLink} size={180} bgColor="#000000" fgColor="#3b82f6" level="H" />
              </div>
            </Card>
          </div>

          {/* Tabs de Navegação */}
          <div className="mb-6 border-b border-blue-900/50">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`border-b-2 pb-4 pt-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'overview'
                    ? 'border-pink-500 text-pink-500 glow-pink-sm'
                    : 'border-transparent text-blue-400 hover:border-blue-500 hover:text-blue-300'
                }`}
              >
                Visão Geral
              </button>
              <button
                onClick={() => setActiveTab('referrals')}
                className={`border-b-2 pb-4 pt-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'referrals'
                    ? 'border-amber-400 text-amber-400 glow-gold-sm'
                    : 'border-transparent text-blue-400 hover:border-blue-500 hover:text-blue-300'
                }`}
              >
                Meus Referidos
              </button>
              <button
                onClick={() => setActiveTab('commissions')}
                className={`border-b-2 pb-4 pt-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'commissions'
                    ? 'border-blue-500 text-blue-500 glow-blue-sm'
                    : 'border-transparent text-blue-400 hover:border-blue-500 hover:text-blue-300'
                }`}
              >
                Comissões
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`border-b-2 pb-4 pt-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'materials'
                    ? 'border-pink-500 text-pink-500 glow-pink-sm'
                    : 'border-transparent text-blue-400 hover:border-blue-500 hover:text-blue-300'
                }`}
              >
                Materiais
              </button>
            </div>
          </div>

          {/* Conteúdo da Tab Atual */}
          {activeTab === 'referrals' && (
            <Card className="bg-black border border-amber-500 rounded-lg p-5 shadow-lg hover:shadow-amber-400/20 transition-all duration-300">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-pink-900">
                  <thead className="bg-black/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">Usuário</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">Data de Registro</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">Depósitos</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">Comissão</th>
                    </tr>
                  </thead>
                  <tbody className="bg-black divide-y divide-pink-900">
                    {mockReferrals.map((referral) => (
                      <tr key={referral.id} className="hover:bg-black/40 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-black/40 border border-blue-500 flex items-center justify-center">
                              <span className="text-amber-400 font-bold">{referral.username.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-amber-400">{referral.username}</div>
                              <div className="text-sm text-pink-400">{referral.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-400">{referral.joinDate}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            referral.status === 'ACTIVE' 
                              ? 'bg-blue-900/50 text-blue-400 border border-blue-500' 
                              : 'bg-pink-900/50 text-pink-400 border border-pink-500'
                          }`}>
                            {referral.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-400">${referral.totalDeposits.toFixed(2)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-amber-400 glow-gold-sm">${referral.commissionGenerated.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="bg-black border border-blue-500 rounded-lg p-5 shadow-lg hover:shadow-blue-400/20 transition-all duration-300">
                <h3 className="mb-4 text-xl font-semibold text-blue-500 glow-blue">Desempenho do Mês</h3>
                <div className="h-60 bg-black/30 border border-blue-500/30 rounded-lg flex items-center justify-center">
                  <p className="text-pink-400">Gráfico de Desempenho</p>
                </div>
              </Card>
              
              <Card className="bg-black border border-pink-500 rounded-lg p-5 shadow-lg hover:shadow-pink-400/20 transition-all duration-300">
                <h3 className="mb-4 text-xl font-semibold text-pink-500 glow-pink">Próximos Níveis</h3>
                <div className="space-y-4">
                  <div className="rounded-lg bg-black/30 border border-blue-500/30 p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-blue-400">Nível Atual: Diamante</span>
                      <span className="text-amber-400 glow-gold-sm">65%</span>
                    </div>
                    <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-pink-500 h-full rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-black/30 border border-blue-500/30 p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-amber-400 font-medium">Nível Mestre</p>
                        <p className="text-sm text-blue-400">+2% de comissão</p>
                      </div>
                      <span className="text-pink-400">50 referidos</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
