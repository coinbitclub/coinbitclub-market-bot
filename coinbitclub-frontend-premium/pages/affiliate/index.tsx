import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ShareIcon,
  QrCodeIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  SparklesIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import QRCode from 'qrcode.react';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import Layout from '../../src/components/Layout';

// Types
interface AffiliateStats {
  totalReferrals: number;
  activeReferrals: number;
  totalCommissions: number;
  monthlyCommissions: number;
  conversionRate: number;
  tier: string;
}

interface Referral {
  id: string;
  username: string;
  email: string;
  joinDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  totalDeposits: number;
  commissionGenerated: number;
  lastActivity: string;
}

interface Commission {
  id: string;
  referralId: string;
  referralUsername: string;
  amount: number;
  type: 'DEPOSIT' | 'TRADING' | 'SUBSCRIPTION';
  date: string;
  status: 'PENDING' | 'PAID';
}

interface AIReport {
  id: string;
  type: string;
  title: string;
  content: any;
  createdAt: string;
}

const AffiliateDashboard: NextPage = () => {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [aiReports, setAiReports] = useState<AIReport[]>([]);
  const [affiliateLink, setAffiliateLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAffiliateData();
    fetchAIReports();
    
    // Update AI reports every 4 hours
    const interval = setInterval(fetchAIReports, 4 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAffiliateData = () => {
    // Mock data - será substituído pela API real
    setStats({
      totalReferrals: 127,
      activeReferrals: 89,
      totalCommissions: 2456.78,
      monthlyCommissions: 478.90,
      conversionRate: 23.5,
      tier: 'GOLD',
    });

    setReferrals([
      {
        id: '1',
        username: 'crypto_trader_01',
        email: 'trader01@email.com',
        joinDate: '2024-12-15',
        status: 'ACTIVE',
        totalDeposits: 1250,
        commissionGenerated: 125.50,
        lastActivity: '2025-01-17T10:30:00Z',
      },
      {
        id: '2',
        username: 'hodler_supreme',
        email: 'hodler@email.com',
        joinDate: '2024-11-20',
        status: 'ACTIVE',
        totalDeposits: 5600,
        commissionGenerated: 280.30,
        lastActivity: '2025-01-16T15:45:00Z',
      },
      {
        id: '3',
        username: 'day_trader_99',
        email: 'daytrader@email.com',
        joinDate: '2024-10-05',
        status: 'INACTIVE',
        totalDeposits: 800,
        commissionGenerated: 40.20,
        lastActivity: '2025-01-10T08:20:00Z',
      },
    ]);

    setCommissions([
      {
        id: '1',
        referralId: '1',
        referralUsername: 'crypto_trader_01',
        amount: 25.50,
        type: 'DEPOSIT',
        date: '2025-01-17T09:00:00Z',
        status: 'PENDING',
      },
      {
        id: '2',
        referralId: '2',
        referralUsername: 'hodler_supreme',
        amount: 112.00,
        type: 'TRADING',
        date: '2025-01-16T14:30:00Z',
        status: 'PAID',
      },
      {
        id: '3',
        referralId: '1',
        referralUsername: 'crypto_trader_01',
        amount: 15.90,
        type: 'SUBSCRIPTION',
        date: '2025-01-15T11:15:00Z',
        status: 'PAID',
      },
    ]);

    setAffiliateLink('https://coinbitclub.vip/ref/abc123xyz');
  };

  const fetchAIReports = async () => {
    try {
      // Mock AI reports específicos para afiliados - será substituído pela API real
      setAiReports([
        {
          id: '1',
          type: 'affiliate_performance',
          title: 'Análise de Performance de Afiliado',
          content: {
            conversion_rate: '23.5%',
            quality_score: 8.7,
            top_performers: ['crypto_trader_01', 'hodler_supreme'],
            recommendations: [
              'Taxa de conversão acima da média do programa',
              'Qualidade das referências está excelente',
              'Foque em canais que trouxeram crypto_trader_01',
              'Considere criar conteúdo educativo sobre trading'
            ],
            growth_potential: 'High',
            next_tier_requirements: '3 referências ativas adicionais'
          },
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          type: 'market_opportunities',
          title: 'Oportunidades de Mercado para Afiliados',
          content: {
            trending_keywords: ['AI trading', 'crypto bot', 'automated trading'],
            best_channels: ['Telegram', 'YouTube', 'Discord'],
            optimal_posting_times: ['18:00-21:00', '09:00-12:00'],
            recommendations: [
              'Mercado de bots de trading em alta de 35%',
              'Público-alvo mais ativo nos fins de semana',
              'Conteúdo educativo gera 40% mais conversões',
              'Stories no Instagram têm 60% mais engajamento'
            ],
            commission_forecast: '+15% nos próximos 30 dias'
          },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error fetching AI reports:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CoinBitClub MarketBot',
          text: 'Junte-se ao melhor bot de trading do mercado!',
          url: affiliateLink,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      copyToClipboard(affiliateLink);
    }
  };

  if (!stats) {
    return <div>Loading...</div>;
  }

  return (
    <Layout 
      title="Programa de Afiliados - CoinBitClub MarketBot" 
      description="Dashboard do programa de afiliados com insights de IA"
    >
      <div className="text-foreground">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary">Programa de Afiliados</h1>
                <p className="mt-1 text-muted-foreground">
                  Tier {stats.tier} • Ganhe até 30% de comissão por referência
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => copyToClipboard(affiliateLink)}
                >
                  <div className="flex items-center gap-2">
                    {copied ? <CheckIcon className="size-4" /> : <ClipboardDocumentIcon className="size-4" />}
                    {copied ? 'Copiado!' : 'Copiar Link'}
                  </div>
                </Button>
                <Button
                  variant="accent"
                  onClick={shareLink}
                >
                  <div className="flex items-center gap-2">
                    <ShareIcon className="size-4" />
                    Compartilhar
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto space-y-8 px-4 py-8">
          {/* Stats Cards */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Referências
                  </p>
                  <p className="mt-1 text-2xl font-bold">{stats.totalReferrals}</p>
                  <p className="mt-1 text-sm text-success">
                    {stats.activeReferrals} ativas
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                  <UserGroupIcon className="size-6" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Comissões Totais
                  </p>
                  <p className="mt-1 text-2xl font-bold">${stats.totalCommissions.toFixed(2)}</p>
                  <p className="mt-1 text-sm text-success">
                    +${stats.monthlyCommissions.toFixed(2)} este mês
                  </p>
                </div>
                <div className="rounded-lg bg-success/10 p-3 text-success">
                  <CurrencyDollarIcon className="size-6" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Taxa de Conversão
                  </p>
                  <p className="mt-1 text-2xl font-bold">{stats.conversionRate}%</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Últimos 30 dias
                  </p>
                </div>
                <div className="rounded-lg bg-accent/10 p-3 text-accent">
                  <ShareIcon className="size-6" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Tier Atual
                  </p>
                  <p className="mt-1 text-2xl font-bold">{stats.tier}</p>
                  <p className="text-info mt-1 text-sm">
                    25% de comissão
                  </p>
                </div>
                <div className="rounded-lg bg-warning/10 p-3 text-warning">
                  <QrCodeIcon className="size-6" />
                </div>
              </div>
            </Card>
          </section>

          {/* AI Reports Section */}
          <section>
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="flex items-center text-xl font-semibold">
                  <SparklesIcon className="mr-2 size-5 text-primary" />
                  Análises de IA para Afiliados (Atualizadas a cada 4h)
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Insights personalizados para otimizar suas estratégias de afiliação
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {aiReports.map((report) => (
                  <div key={report.id} className="rounded-lg border border-border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold">{report.title}</h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    {report.content.conversion_rate && (
                      <div className="mb-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Taxa de Conversão:</span>
                          <span className="text-sm font-medium text-success">{report.content.conversion_rate}</span>
                        </div>
                        {report.content.quality_score && (
                          <div className="flex justify-between">
                            <span className="text-sm">Score de Qualidade:</span>
                            <span className="text-sm font-medium">{report.content.quality_score}/10</span>
                          </div>
                        )}
                        {report.content.growth_potential && (
                          <div className="flex justify-between">
                            <span className="text-sm">Potencial de Crescimento:</span>
                            <span className={`text-sm font-medium ${
                              report.content.growth_potential === 'High' ? 'text-success' : 
                              report.content.growth_potential === 'Medium' ? 'text-warning' : 'text-muted-foreground'
                            }`}>
                              {report.content.growth_potential}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {report.content.trending_keywords && (
                      <div className="mb-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Palavras-chave em Alta:</span>
                          <span className="text-sm font-medium">{report.content.trending_keywords.join(', ')}</span>
                        </div>
                        {report.content.best_channels && (
                          <div className="flex justify-between">
                            <span className="text-sm">Melhores Canais:</span>
                            <span className="text-sm font-medium">{report.content.best_channels.join(', ')}</span>
                          </div>
                        )}
                        {report.content.commission_forecast && (
                          <div className="flex justify-between">
                            <span className="text-sm">Previsão de Comissões:</span>
                            <span className="text-sm font-medium text-success">{report.content.commission_forecast}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {report.content.recommendations && (
                      <div className="mb-3">
                        <h4 className="mb-2 text-sm font-medium">Recomendações:</h4>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {report.content.recommendations.map((rec: string, index: number) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {report.content.top_performers && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-success">Top Performers:</h4>
                        <div className="flex gap-2">
                          {report.content.top_performers.map((performer: string, index: number) => (
                            <span key={index} className="rounded bg-success/10 px-2 py-1 text-xs text-success">
                              {performer}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.content.next_tier_requirements && (
                      <div className="mt-3 rounded-lg bg-primary/10 p-3">
                        <h4 className="mb-1 text-sm font-medium text-primary">Próximo Tier:</h4>
                        <p className="text-xs text-primary">{report.content.next_tier_requirements}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* Affiliate Link & QR Code */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <div className="mb-4">
                <h2 className="flex items-center text-xl font-semibold">
                  <ShareIcon className="mr-2 size-5 text-primary" />
                  Seu Link de Afiliado
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Compartilhe este link para ganhar comissões
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={affiliateLink}
                    readOnly
                    className="flex-1 rounded-md border border-border bg-muted px-3 py-2 text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(affiliateLink)}
                    leftIcon={copied ? <CheckIcon className="size-4" /> : <ClipboardDocumentIcon className="size-4" />}
                  >
                    {copied ? 'Copiado!' : 'Copiar'}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="accent"
                    className="flex-1"
                    onClick={shareLink}
                    leftIcon={<ShareIcon className="size-4" />}
                  >
                    Compartilhar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    leftIcon={<UserGroupIcon className="size-4" />}
                  >
                    Ver Programa
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4">
                <h2 className="flex items-center text-xl font-semibold">
                  <QrCodeIcon className="mr-2 size-5 text-primary" />
                  QR Code
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Escaneie para acessar diretamente
                </p>
              </div>

              <div className="flex justify-center">
                <div className="rounded-lg bg-white p-4">
                  <QRCode
                    value={affiliateLink}
                    size={160}
                    level="M"
                    includeMargin={true}
                  />
                </div>
              </div>
            </Card>
          </section>

          {/* Referrals Table */}
          <section>
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="flex items-center text-xl font-semibold">
                  <UserGroupIcon className="mr-2 size-5 text-primary" />
                  Suas Referências ({referrals.length})
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Acompanhe o desempenho dos seus referidos
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 text-left font-medium text-muted-foreground">Usuário</th>
                      <th className="py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="py-3 text-right font-medium text-muted-foreground">Depósitos</th>
                      <th className="py-3 text-right font-medium text-muted-foreground">Comissões</th>
                      <th className="py-3 text-right font-medium text-muted-foreground">Última Atividade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((referral) => (
                      <tr key={referral.id} className="border-b border-border">
                        <td className="py-4">
                          <div>
                            <p className="font-medium">{referral.username}</p>
                            <p className="text-sm text-muted-foreground">{referral.email}</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`rounded px-2 py-1 text-xs font-medium ${
                            referral.status === 'ACTIVE' 
                              ? 'bg-success/10 text-success' 
                              : 'bg-muted/10 text-muted-foreground'
                          }`}>
                            {referral.status}
                          </span>
                        </td>
                        <td className="py-4 text-right font-medium">
                          ${referral.totalDeposits.toLocaleString()}
                        </td>
                        <td className="py-4 text-right font-medium text-success">
                          ${referral.commissionGenerated.toFixed(2)}
                        </td>
                        <td className="py-4 text-right text-sm text-muted-foreground">
                          {new Date(referral.lastActivity).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          {/* Commissions Table */}
          <section>
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="flex items-center text-xl font-semibold">
                  <CurrencyDollarIcon className="mr-2 size-5 text-primary" />
                  Histórico de Comissões
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Suas comissões mais recentes
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 text-left font-medium text-muted-foreground">Referência</th>
                      <th className="py-3 text-left font-medium text-muted-foreground">Tipo</th>
                      <th className="py-3 text-right font-medium text-muted-foreground">Valor</th>
                      <th className="py-3 text-center font-medium text-muted-foreground">Status</th>
                      <th className="py-3 text-right font-medium text-muted-foreground">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((commission) => (
                      <tr key={commission.id} className="border-b border-border">
                        <td className="py-4 font-medium">{commission.referralUsername}</td>
                        <td className="py-4">
                          <span className={`rounded px-2 py-1 text-xs font-medium ${
                            commission.type === 'DEPOSIT' ? 'bg-info/10 text-info' :
                            commission.type === 'TRADING' ? 'bg-success/10 text-success' :
                            'bg-accent/10 text-accent'
                          }`}>
                            {commission.type}
                          </span>
                        </td>
                        <td className="py-4 text-right font-medium text-success">
                          ${commission.amount.toFixed(2)}
                        </td>
                        <td className="py-4 text-center">
                          <span className={`rounded px-2 py-1 text-xs font-medium ${
                            commission.status === 'PAID' 
                              ? 'bg-success/10 text-success' 
                              : 'bg-warning/10 text-warning'
                          }`}>
                            {commission.status}
                          </span>
                        </td>
                        <td className="py-4 text-right text-sm text-muted-foreground">
                          {new Date(commission.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </Layout>
  );
};

export default AffiliateDashboard;
