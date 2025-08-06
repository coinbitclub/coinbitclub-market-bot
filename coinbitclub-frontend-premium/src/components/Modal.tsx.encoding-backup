import React from 'react';
import { ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export default function Modal({ open, onClose, children }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="rounded bg-gray-800 p-4">
        {children}
        <button type="button" className="mt-2" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
