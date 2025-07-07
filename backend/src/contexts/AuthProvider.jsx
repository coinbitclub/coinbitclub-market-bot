import { createContext, useContext, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
const [user, setUser] = useState(null)

async function login({ email, password }) {
const { data } = await api.post('/auth/login', { email, password })
localStorage.setItem('authToken', data.token)
setUser(data.user)
}

function logout() {
localStorage.removeItem('authToken')
setUser(null)
}

return (
<AuthContext.Provider value={{ user, login, logout }}>

{children}
</AuthContext.Provider>

)

}

export const useAuth = () => useContext(AuthContext)