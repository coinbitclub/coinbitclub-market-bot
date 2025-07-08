// src/hooks/useBotStatus.js
import { useEffect, useState } from 'react'
import { status, sendSignal } from './api'

export function useBotStatus() {
  const [text, setText] = useState('carregando…')
  useEffect(() => {
    status()
      .then(setText)
      .catch(() => setText('Erro ao conectar'))
  }, [])
  return text
}

// Em qualquer componente:
import React, { useState } from 'react'
import { useBotStatus } from './hooks/useBotStatus'
import { sendSignal } from './api'

export function App() {
  const status = useBotStatus()
  const [resp, setResp] = useState(null)

  const onClick = async () => {
    try {
      const result = await sendSignal({ symbol: 'BTCUSDT', price: 40000, side: 'buy' })
      setResp(`OK: ${result.id}`)
    } catch (err) {
      setResp(`Erro: ${err.error || err.message}`)
    }
  }

  return (
    <div>
      <h1>Status do Bot: {status}</h1>
      <button onClick={onClick}>Enviar Signal</button>
      {resp && <p>{resp}</p>}
    </div>
  )
}
