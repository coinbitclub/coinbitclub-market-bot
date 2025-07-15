import useSWR from 'swr'
import Sidebar from '../../components/Sidebar'
import { fetchAffiliateMetrics } from '../../lib/api'

const fetcher = () => fetchAffiliateMetrics().then((r) => r.data)

export default function Affiliate() {
  const { data } = useSWR('affiliate-metrics', fetcher)
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8 space-y-4">
        <h1 className="text-2xl font-bold mb-4">Affiliate Dashboard</h1>
        {data ? (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="font-semibold">Total Referrals</h3>
              <p>{data.total}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="font-semibold">Comissões Pendentes</h3>
              <p>{data.pending}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="font-semibold">Comissões Pagas</h3>
              <p>{data.paid}</p>
            </div>
          </div>
        ) : (
          <p>Carregando...</p>
        )}
      </main>
    </div>
  )
}
