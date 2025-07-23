import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import Layout from '../../src/components/Layout';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ShareIcon,
  QrCodeIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

// Types
interface AffiliateStats {
  totalReferrals: number;
  activeReferrals: number;
  totalCommissions: number;
  monthlyCommissions: number;
  conversionRate: number;
  tier: string;
}

interface AIReport {
  id: string;
  title: string;
  content: {
    conversion_rate?: string;
    quality_score?: number;
    recommendations?: string[];
    growth_potential?: string;
  };
  createdAt: string;
}

const AffiliateDashboard: NextPage = () => {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [aiReports, setAiReports] = useState<AIReport[]>([]);
  const [copied, setCopied] = useState(false);
  const affiliateLink = 'https://coinbitclub.com/ref/user123';

  useEffect(() => {
    // Simulate loading data
    setStats({
      totalReferrals: 47,
      activeReferrals: 23,
      totalCommissions: 1247.80,
      monthlyCommissions: 328.50,
      conversionRate: 18.5,
      tier: 'Gold'
    });

    setAiReports([
      {
        id: '1',
        title: 'Análise de Performance - Janeiro 2024',
        content: {
          conversion_rate: '23.5%',
          quality_score: 8.7,
          recommendations: [
            'Taxa de conversão acima da média do programa',
            'Qualidade das referências está excelente',
            'Foque em canais que trouxeram crypto_trader_01'
          ],
          growth_potential: 'High'
        },
        createdAt: '2024-01-20T10:30:00Z'
      }
    ]);
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!stats) {
    return (
      <Layout title="Carregando... - CoinBitClub">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-xl">Carregando...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Programa de Afiliados - CoinBitClub">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Programa de Afiliados</h1>
              <p className="mt-1 text-gray-400">
                Tier {stats.tier} • Ganhe até 30% de comissão por referência
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => copyToClipboard(affiliateLink)}
                className="flex items-center gap-2 rounded-md border border-gray-600 px-4 py-2 text-sm transition-colors hover:bg-gray-700"
              >
                {copied ? <CheckIcon className="size-4" /> : <ClipboardDocumentIcon className="size-4" />}
                {copied ? 'Copiado!' : 'Copiar Link'}
              </button>
              <button className="flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm text-white transition-colors hover:bg-cyan-700">
                <ShareIcon className="size-4" />
                Compartilhar
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Stats Cards */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total de Referências</p>
                  <p className="mt-1 text-2xl font-bold">{stats.totalReferrals}</p>
                  <p className="mt-1 text-sm text-green-400">{stats.activeReferrals} ativas</p>
                </div>
                <div className="rounded-lg bg-cyan-600/10 p-3 text-cyan-400">
                  <UserGroupIcon className="size-5" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Comissões Totais</p>
                  <p className="mt-1 text-2xl font-bold">${stats.totalCommissions.toFixed(2)}</p>
                  <p className="mt-1 text-sm text-green-400">+${stats.monthlyCommissions.toFixed(2)} este mês</p>
                </div>
                <div className="rounded-lg bg-green-600/10 p-3 text-green-400">
                  <CurrencyDollarIcon className="size-5" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Taxa de Conversão</p>
                  <p className="mt-1 text-2xl font-bold">{stats.conversionRate}%</p>
                  <p className="mt-1 text-sm text-gray-400">Últimos 30 dias</p>
                </div>
                <div className="rounded-lg bg-yellow-600/10 p-3 text-yellow-400">
                  <ShareIcon className="size-5" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Tier Atual</p>
                  <p className="mt-1 text-2xl font-bold">{stats.tier}</p>
                  <p className="mt-1 text-sm text-blue-400">25% de comissão</p>
                </div>
                <div className="rounded-lg bg-yellow-600/10 p-3 text-yellow-400">
                  <QrCodeIcon className="size-5" />
                </div>
              </div>
            </div>
          </section>

          {/* AI Reports Section */}
          <section>
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
              <div className="mb-6">
                <h2 className="flex items-center text-xl font-semibold">
                  <SparklesIcon className="mr-2 size-5 text-cyan-400" />
                  Análises de IA para Afiliados
                </h2>
                <p className="mt-1 text-gray-400">
                  Insights personalizados para otimizar suas estratégias de afiliação
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {aiReports.map((report) => (
                  <div key={report.id} className="rounded-lg border border-gray-600 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold">{report.title}</h3>
                      <span className="text-xs text-gray-400">
                        20/01/2024 às 10:30
                      </span>
                    </div>
                    
                    {report.content.conversion_rate && (
                      <div className="mb-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Taxa de Conversão:</span>
                          <span className="text-sm font-medium text-green-400">{report.content.conversion_rate}</span>
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
                            <span className="text-sm font-medium text-green-400">
                              {report.content.growth_potential}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {report.content.recommendations && (
                      <div className="mb-3">
                        <h4 className="mb-2 text-sm font-medium">Recomendações:</h4>
                        <ul className="space-y-1 text-xs text-gray-400">
                          {report.content.recommendations.map((rec: string, index: number) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Affiliate Link */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
              <div className="mb-4">
                <h2 className="flex items-center text-xl font-semibold">
                  <ShareIcon className="mr-2 size-5 text-cyan-400" />
                  Seu Link de Afiliado
                </h2>
                <p className="mt-1 text-gray-400">Compartilhe este link para ganhar comissões</p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={affiliateLink}
                    readOnly
                    className="flex-1 rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white"
                  />
                  <button
                    onClick={() => copyToClipboard(affiliateLink)}
                    className="flex items-center gap-2 rounded-md border border-gray-600 px-4 py-2 transition-colors hover:bg-gray-700"
                  >
                    {copied ? <CheckIcon className="size-4" /> : <ClipboardDocumentIcon className="size-4" />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
              <div className="mb-4">
                <h2 className="flex items-center text-xl font-semibold">
                  <QrCodeIcon className="mr-2 size-5 text-cyan-400" />
                  QR Code
                </h2>
                <p className="mt-1 text-gray-400">Escaneie para acessar diretamente</p>
              </div>

              <div className="flex justify-center">
                <div className="rounded-lg bg-white p-4">
                  <div className="flex size-32 items-center justify-center rounded bg-gray-300">
                    <span className="text-xs text-gray-600">QR Code</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Commission History */}
          <section>
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
              <div className="mb-6">
                <h2 className="flex items-center text-xl font-semibold">
                  <CurrencyDollarIcon className="mr-2 size-5 text-cyan-400" />
                  Histórico de Comissões
                </h2>
                <p className="mt-1 text-gray-400">Suas últimas transações e pagamentos</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="pb-3 text-left text-sm font-medium text-gray-400">Data</th>
                      <th className="pb-3 text-left text-sm font-medium text-gray-400">Usuário</th>
                      <th className="pb-3 text-left text-sm font-medium text-gray-400">Tipo</th>
                      <th className="pb-3 text-right text-sm font-medium text-gray-400">Comissão</th>
                      <th className="pb-3 text-right text-sm font-medium text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    <tr>
                      <td className="py-3 text-sm text-gray-300">20/01/2024</td>
                      <td className="py-3 text-sm">crypto_trader_01</td>
                      <td className="py-3 text-sm">Assinatura Premium</td>
                      <td className="py-3 text-right text-sm font-medium">$25.00</td>
                      <td className="py-3 text-right">
                        <span className="rounded bg-green-600/20 px-2 py-1 text-xs text-green-400">
                          Pago
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-sm text-gray-300">18/01/2024</td>
                      <td className="py-3 text-sm">invest_pro_22</td>
                      <td className="py-3 text-sm">Plano Básico</td>
                      <td className="py-3 text-right text-sm font-medium">$12.50</td>
                      <td className="py-3 text-right">
                        <span className="rounded bg-green-600/20 px-2 py-1 text-xs text-green-400">
                          Pago
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-sm text-gray-300">15/01/2024</td>
                      <td className="py-3 text-sm">moon_hodler</td>
                      <td className="py-3 text-sm">Assinatura Premium</td>
                      <td className="py-3 text-right text-sm font-medium">$25.00</td>
                      <td className="py-3 text-right">
                        <span className="rounded bg-yellow-600/20 px-2 py-1 text-xs text-yellow-400">
                          Pendente
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Marketing Materials */}
          <section>
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
              <div className="mb-6">
                <h2 className="flex items-center text-xl font-semibold">
                  <ShareIcon className="mr-2 size-5 text-cyan-400" />
                  Material de Marketing
                </h2>
                <p className="mt-1 text-gray-400">Recursos para ajudar a promover o CoinBitClub</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-gray-600 bg-gray-700 p-4">
                  <h3 className="mb-2 font-medium">Banners para Website</h3>
                  <p className="mb-3 text-sm text-gray-400">Banners responsivos em diferentes tamanhos</p>
                  <button className="w-full rounded bg-cyan-600 px-4 py-2 text-sm transition-colors hover:bg-cyan-700">
                    Download ZIP
                  </button>
                </div>

                <div className="rounded-lg border border-gray-600 bg-gray-700 p-4">
                  <h3 className="mb-2 font-medium">Posts para Redes Sociais</h3>
                  <p className="mb-3 text-sm text-gray-400">Templates para Instagram, Twitter e Facebook</p>
                  <button className="w-full rounded bg-cyan-600 px-4 py-2 text-sm transition-colors hover:bg-cyan-700">
                    Download ZIP
                  </button>
                </div>

                <div className="rounded-lg border border-gray-600 bg-gray-700 p-4">
                  <h3 className="mb-2 font-medium">Guia de Afiliados</h3>
                  <p className="mb-3 text-sm text-gray-400">PDF com dicas e estratégias de conversão</p>
                  <button className="w-full rounded bg-cyan-600 px-4 py-2 text-sm transition-colors hover:bg-cyan-700">
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default AffiliateDashboard;
