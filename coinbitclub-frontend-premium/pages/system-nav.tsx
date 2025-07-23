import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {
  HomeIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CalculatorIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import Card from '../src/components/Card';

const SystemNavigationPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Sistema CoinBitClub - Navegação</title>
        <meta name="description" content="Navegação completa do sistema CoinBitClub MarketBot" />
      </Head>

      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="mb-2 text-4xl font-bold text-primary">CoinBitClub MarketBot</h1>
              <p className="text-xl text-muted-foreground">
                Sistema Completo de Trading com IA, Gestão Financeira e Contábil
              </p>
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="flex items-center text-sm text-success">
                  <SparklesIcon className="mr-1 size-4" />
                  Relatórios de IA a cada 4h
                </div>
                <div className="text-info flex items-center text-sm">
                  <ChartBarIcon className="mr-1 size-4" />
                  Analytics Avançados
                </div>
                <div className="flex items-center text-sm text-warning">
                  <BanknotesIcon className="mr-1 size-4" />
                  Gestão Financeira Completa
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          {/* User Dashboards */}
          <section className="mb-12">
            <h2 className="mb-6 flex items-center text-2xl font-semibold">
              <UsersIcon className="mr-2 size-6 text-primary" />
              Dashboards de Usuário
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Link href="/dashboard">
                <Card className="cursor-pointer p-6 transition-shadow hover:shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-lg bg-primary/10 p-3 text-primary">
                      <ChartBarIcon className="size-8" />
                    </div>
                    <span className="rounded-full bg-success/10 px-2 py-1 text-xs text-success">
                      IA 4h
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Dashboard Principal</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Métricas de performance, posições abertas e fechadas, relatórios de IA automáticos
                  </p>
                  <div className="text-xs text-muted-foreground">
                    • KPIs em tempo real • Equity curve • Análises de IA
                  </div>
                </Card>
              </Link>

              <Link href="/affiliate">
                <Card className="cursor-pointer p-6 transition-shadow hover:shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-lg bg-success/10 p-3 text-success">
                      <UserGroupIcon className="size-8" />
                    </div>
                    <span className="bg-info/10 text-info rounded-full px-2 py-1 text-xs">
                      Programa
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Programa de Afiliados</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Gestão completa de afiliações, comissões e referências
                  </p>
                  <div className="text-xs text-muted-foreground">
                    • Link personalizado • QR Code • Histórico de comissões
                  </div>
                </Card>
              </Link>

              <Link href="/settings">
                <Card className="cursor-pointer p-6 transition-shadow hover:shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-lg bg-accent/10 p-3 text-accent">
                      <CogIcon className="size-8" />
                    </div>
                    <span className="rounded-full bg-warning/10 px-2 py-1 text-xs text-warning">
                      Personalização
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Configurações</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Parâmetros de risco, preferências de trading e notificações
                  </p>
                  <div className="text-xs text-muted-foreground">
                    • Risk management • Trading preferences • Notifications
                  </div>
                </Card>
              </Link>
            </div>
          </section>

          {/* Admin Dashboards */}
          <section className="mb-12">
            <h2 className="mb-6 flex items-center text-2xl font-semibold">
              <BuildingOfficeIcon className="mr-2 size-6 text-primary" />
              Dashboards Administrativos
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Link href="/admin/dashboard">
                <Card className="cursor-pointer p-6 transition-shadow hover:shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-lg bg-primary/10 p-3 text-primary">
                      <HomeIcon className="size-8" />
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                      Admin
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Dashboard Admin</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Visão geral do sistema, usuários e métricas gerais
                  </p>
                  <div className="text-xs text-muted-foreground">
                    • System overview • User management • Analytics
                  </div>
                </Card>
              </Link>

              <Link href="/admin/financial">
                <Card className="cursor-pointer p-6 transition-shadow hover:shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-lg bg-success/10 p-3 text-success">
                      <BanknotesIcon className="size-8" />
                    </div>
                    <span className="rounded-full bg-success/10 px-2 py-1 text-xs text-success">
                      IA 4h
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Dashboard Financeiro</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Receitas, comissões, saques e relatórios financeiros com IA
                  </p>
                  <div className="text-xs text-muted-foreground">
                    • Revenue tracking • Commission management • AI reports
                  </div>
                </Card>
              </Link>

              <Link href="/admin/accounting">
                <Card className="cursor-pointer p-6 transition-shadow hover:shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="bg-info/10 text-info rounded-lg p-3">
                      <CalculatorIcon className="size-8" />
                    </div>
                    <span className="bg-info/10 text-info rounded-full px-2 py-1 text-xs">
                      IA 4h
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Dashboard Contábil</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    DRE, fluxo de caixa, análise fiscal e relatórios contábeis com IA
                  </p>
                  <div className="text-xs text-muted-foreground">
                    • P&L statements • Cash flow • Tax analysis • AI insights
                  </div>
                </Card>
              </Link>

              <Link href="/admin/users">
                <Card className="cursor-pointer p-6 transition-shadow hover:shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-lg bg-warning/10 p-3 text-warning">
                      <UserGroupIcon className="size-8" />
                    </div>
                    <span className="rounded-full bg-warning/10 px-2 py-1 text-xs text-warning">
                      Admin
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Gestão de Usuários</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    CRUD completo de usuários, assinaturas e permissões
                  </p>
                  <div className="text-xs text-muted-foreground">
                    • User CRUD • Subscription management • Role management
                  </div>
                </Card>
              </Link>
            </div>
          </section>

          {/* System Features */}
          <section className="mb-12">
            <h2 className="mb-6 flex items-center text-2xl font-semibold">
              <SparklesIcon className="mr-2 size-6 text-primary" />
              Recursos do Sistema
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="mb-4 flex items-center text-lg font-semibold">
                  <DocumentTextIcon className="mr-2 size-5 text-primary" />
                  Relatórios de IA Automáticos
                </h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <div className="mr-3 size-2 rounded-full bg-success"></div>
                    <span>Análises de performance da carteira a cada 4 horas</span>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-info mr-3 size-2 rounded-full"></div>
                    <span>Relatórios de mercado com sentimento e sinais</span>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-3 size-2 rounded-full bg-warning"></div>
                    <span>Saúde do sistema e alertas automatizados</span>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-3 size-2 rounded-full bg-accent"></div>
                    <span>Análises financeiras e contábeis com recomendações</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="mb-4 flex items-center text-lg font-semibold">
                  <BanknotesIcon className="mr-2 size-5 text-primary" />
                  Sistema Financeiro Completo
                </h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <div className="mr-3 size-2 rounded-full bg-success"></div>
                    <span>Gestão de receitas e comissões em tempo real</span>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-info mr-3 size-2 rounded-full"></div>
                    <span>Controle de saldos de usuários e saques</span>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-3 size-2 rounded-full bg-warning"></div>
                    <span>Demonstrativo de resultado automático</span>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-3 size-2 rounded-full bg-accent"></div>
                    <span>Análise fiscal e conciliação bancária</span>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* API Status */}
          <section>
            <Card className="p-6">
              <h3 className="mb-4 flex items-center text-lg font-semibold">
                <ChartBarIcon className="mr-2 size-5 text-primary" />
                Status da API
              </h3>
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                <div className="flex items-center justify-between rounded-lg bg-success/10 p-3">
                  <span>API Gateway</span>
                  <span className="font-medium text-success">🟢 Online</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-success/10 p-3">
                  <span>Financial System</span>
                  <span className="font-medium text-success">🟢 Operational</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-success/10 p-3">
                  <span>AI Reports</span>
                  <span className="font-medium text-success">🟢 Running</span>
                </div>
              </div>
              <div className="mt-4 text-center text-xs text-muted-foreground">
                <p>🚀 Sistema executando na porta 8081 • 📊 Relatórios de IA atualizados a cada 4 horas</p>
                <p className="mt-1">💡 Todos os dashboards integrados com análises automáticas de IA</p>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </>
  );
};

export default SystemNavigationPage;
