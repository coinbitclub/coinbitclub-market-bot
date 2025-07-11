import { Routes, Route, Navigate } from 'react-router-dom'
import RequireAuth from './auth/RequireAuth'
import Login from './pages/Login'
import Landing from './pages/Landing'
import PainelLayout from './pages/PainelLayout'
import Dashboard from './pages/Dashboard'
import Sinais from './pages/Sinais'

export default function App() {
return (
<Routes>
<Route path="/" element={<Landing />} />
<Route path="/login" element={<Login />} />

<Route element={<RequireAuth />}>
<Route path="/painel" element={<PainelLayout />}>
<Route index element={<Dashboard />} />
<Route path="sinais" element={<Sinais />} />
{/* outras subrotas */}
</Route>
</Route>

<Route path="*" element={<Navigate to="/" replace />} />
</Routes>

)

}
