import React from 'react';
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function AdminIndex() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to dashboard
    router.push('/admin/dashboard')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-pink-500 shadow-lg shadow-pink-500/30">
          <span className="text-xl font-bold text-black">⚙️</span>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-amber-400 glow-gold">Admin Panel</h1>
        <p className="text-blue-400 glow-blue-sm">Redirecionando para o dashboard...</p>
      </div>
    </div>
  )
}



