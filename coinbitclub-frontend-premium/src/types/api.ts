export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}

export interface Plan {
  id: string
  name: string
  price: number
}

export interface Credential {
  id: string
  exchange: string
  apiKey: string
}

export interface CoinStat {
  symbol: string
  price: number
}

export interface DashboardMetrics {
  accuracy: number
  dailyReturnPct: number
  lifetimeReturnPct: number
}

export interface Balance {
  exchange: string
  balance: number
}

export interface Order {
  id: string
  pair: string
  side: string
  qty: number
  status: string
}

export interface IaLog {
  id: string
  userId: string
  reason: string
}

export interface Report {
  id: string
  url: string
}
