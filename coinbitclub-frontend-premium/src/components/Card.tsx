import { ReactNode } from 'react'

export default function Card({ children }: { children: ReactNode }) {
  return <div className="bg-gray-800 rounded p-4">{children}</div>
}
