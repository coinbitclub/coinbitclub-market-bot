import useSWR from 'swr'
import {
  fetchDashboardMetrics,
  fetchDashboardBalances,
  fetchOpenPositions,
} from '../../lib/api'
import Sidebar from '../../components/Sidebar'
import Notifications from '../../components/Notifications'

const metrics = () => fetchDashboardMetrics().then((r) => r.data)
const balances = () => fetchDashboardBalances().then((r) => r.data)
const positions = () => fetchOpenPositions().then((r) => r.data)

export default function Dashboard() {
  const { data: m } = useSWR('metrics', metrics)
  const { data: b } = useSWR('balances', balances)
  const { data: p } = useSWR('positions', positions)

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8 space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {m ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded">Accuracy {m.accuracy}%</div>
            <div className="bg-gray-800 p-4 rounded">Daily {m.dailyReturnPct}%</div>
            <div className="bg-gray-800 p-4 rounded">Lifetime {m.lifetimeReturnPct}%</div>
          </div>
        ) : (
          <p>Loading...</p>
        )}
        {b && (
          <div className="grid grid-cols-3 gap-4">
            {b.map((bal: any) => (
              <div key={bal.exchange} className="bg-gray-800 p-4 rounded">
                {bal.exchange}: {bal.balance}
              </div>
            ))}
          </div>
        )}
        {p && (
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-semibold mb-2">Open Positions</h3>
            <ul className="space-y-1 text-sm">
              {p.map((pos: any) => (
                <li key={pos.id}>{pos.pair} {pos.qty} {pos.side}</li>
              ))}
            </ul>
          </div>
        )}
        <Notifications />
      </main>
    </div>
  )
}
