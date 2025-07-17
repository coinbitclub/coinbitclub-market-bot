import Link from 'next/link'
import { SunIcon, MoonIcon } from '@radix-ui/react-icons'
import { useTheme } from './ThemeProvider'

export default function Navbar() {
  const { theme, toggle } = useTheme()
  return (
    <nav className="p-4 bg-background flex justify-between items-center">
      <Link href="/" className="text-primary font-bold">
        CoinbitClub
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="mx-2">
          Dashboard
        </Link>
        <Link href="/affiliate" className="mx-2">
          Afiliado
        </Link>
        <button type="button" onClick={toggle} aria-label="Toggle Theme">
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </nav>
  )
}
