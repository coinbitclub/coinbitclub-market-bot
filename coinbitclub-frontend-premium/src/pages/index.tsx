import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>CoinbitClub MarketBot</title>
        <meta name="description" content="Automated trading with AI" />
        <meta property="og:title" content="MarketBot Premium" />
      </Head>
      <main className="flex-grow">
        <section className="h-screen bg-gradient-to-br from-background to-black flex flex-col items-center justify-center text-center p-8">
          <h1 className="text-5xl font-bold mb-4">MarketBot Premium</h1>
          <p className="mb-8 max-w-xl">Robôs de trading com IA 24/7 conectados às principais exchanges</p>
          <div className="space-x-4">
            <Link href="/dashboard" className="bg-accent text-black px-6 py-2 rounded">
              Quero Testar Grátis
            </Link>
            <Link href="#como-funciona" className="text-primary underline">
              Como Funciona o MarketBot
            </Link>
          </div>
        </section>
        <section id="como-funciona" className="p-8 grid md:grid-cols-3 gap-4">
          <div className="bg-gray-800 p-6 rounded">
            <h3 className="font-semibold mb-2">Saldo Seguro</h3>
            <p>Custódia em sua exchange favorita</p>
          </div>
          <div className="bg-gray-800 p-6 rounded">
            <h3 className="font-semibold mb-2">IA 24/7</h3>
            <p>Operações automáticas dia e noite</p>
          </div>
          <div className="bg-gray-800 p-6 rounded">
            <h3 className="font-semibold mb-2">Lucros em Tempo Real</h3>
            <p>Acompanhe cada trade no dashboard</p>
          </div>
        </section>
        <section className="p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">Configure sua IA em 4 passos</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <button className="bg-gray-800 p-4 rounded hover:bg-gray-700">
              Leitura de Mercado
            </button>
            <button className="bg-gray-800 p-4 rounded hover:bg-gray-700">
              Seleção de Ativos
            </button>
            <button className="bg-gray-800 p-4 rounded hover:bg-gray-700">
              Escolha do Robô
            </button>
            <button className="bg-gray-800 p-4 rounded hover:bg-gray-700">
              Gestão de Riscos
            </button>
          </div>
        </section>
        <section className="p-8 grid md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-800 p-4 rounded">Certificado</div>
          <div className="bg-gray-800 p-4 rounded">12 meses</div>
          <div className="bg-gray-800 p-4 rounded">30 dias grátis</div>
          <div className="bg-gray-800 p-4 rounded">Bônus exclusivo</div>
        </section>
      </main>
      <footer className="p-4 text-sm text-gray-400 text-center">© 2025 CoinbitClub</footer>
    </div>
  )
}
