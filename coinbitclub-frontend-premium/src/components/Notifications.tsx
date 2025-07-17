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
    <div className="space-y-2">
      {messages.map((msg, idx) => (
        <div key={idx} className="bg-gray-700 p-2 rounded">
          {msg}
        </div>
      ))}
    </div>
  )
}
