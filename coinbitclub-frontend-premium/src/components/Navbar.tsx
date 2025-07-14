import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="p-4 bg-background flex justify-between items-center">
      <Link href="/">
        <a className="text-primary font-bold">CoinbitClub</a>
      </Link>
      <div>
        <Link href="/dashboard">
          <a className="mx-2">Dashboard</a>
        </Link>
        <Link href="/affiliate">
          <a className="mx-2">Afiliado</a>
        </Link>
      </div>
    </nav>
  )
}
