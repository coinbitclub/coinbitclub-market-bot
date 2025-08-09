import React from 'react';
import { useEffect, useState } from 'react'

export default function Notifications() {
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const es = new EventSource('/events')
    es.onmessage = (e) => {
      setMessages((prev) => [...prev, e.data])
    }
    return () => es.close()
  }, [])

  return (
    <div className="space-y-3">
      {messages.map((msg, idx) => (
        <div 
          key={idx} 
          className="rounded-lg bg-black border border-blue-500/50 p-3 shadow-md hover:shadow-blue-500/20 transition-all duration-300 text-amber-400"
        >
          {msg}
        </div>
      ))}
    </div>
  )
}


