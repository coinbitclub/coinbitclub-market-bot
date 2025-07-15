import Link from 'next/link'
import { useState } from 'react'
import { HamburgerMenuIcon } from '@radix-ui/react-icons'

export default function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <aside className="bg-background text-white w-64" data-open={open}>
      <button
        type="button"
        className="p-2 md:hidden"
        onClick={() => setOpen(!open)}
      >
        <HamburgerMenuIcon />
      </button>
      <nav className="p-4 space-y-2" hidden={!open && typeof window !== 'undefined' && window.innerWidth < 768}>
        <Link href="/dashboard" className="block">
          Dashboard
        </Link>
        <Link href="/affiliate" className="block">
          Afiliado
        </Link>
        <Link href="/admin/dashboard" className="block">
          Admin
        </Link>
      </nav>
    </aside>
  )
}
