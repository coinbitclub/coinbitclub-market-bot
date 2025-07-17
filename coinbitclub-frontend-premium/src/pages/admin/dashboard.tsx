import useSWR from 'swr'
import Sidebar from '../../components/Sidebar'
import { fetchAdminMetrics } from '../../lib/api'

const fetcher = () => fetchAdminMetrics().then((r) => r.data)

export default function AdminDashboard() {
  const { data } = useSWR('admin-metrics', fetcher)
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8 space-y-4">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        {data ? (
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="font-semibold">Usuários</h3>
              <p>{data.users}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="font-semibold">Positions Abertas</h3>
              <p>{data.openPositions}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="font-semibold">P/L Agregado</h3>
              <p>{data.pl}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="font-semibold">Accuracy Histórica</h3>
              <p>{data.accuracy}%</p>
            </div>
          </div>
        ) : (
          <p>Carregando...</p>
        )}
      </main>
    </div>
  )
}
