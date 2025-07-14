import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>CoinbitClub MarketBot</title>
        <meta name="description" content="Automated trading with AI" />
      </Head>
      <main className="flex-grow p-8 text-center">
        <h1 className="text-4xl font-bold mb-4">MarketBot Premium</h1>
        <p className="mb-8">Plataforma de trading inteligente</p>
        <Link href="/dashboard">
          <a className="bg-accent text-black px-6 py-2 rounded">Quero Testar Grátis</a>
        </Link>
      </main>
      <footer className="p-4 text-sm text-gray-400">© 2025 CoinbitClub</footer>
    </div>
  )
}
