'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import AdminLayout from './admin-layout'
import { 
  DollarSign, CreditCard, TrendingUp, TrendingDown, Download,
  Plus, Minus, Search, Filter, Calendar, BarChart3,
  Wallet, Receipt, ArrowUpRight, ArrowDownLeft, RefreshCw,
  Eye, MoreHorizontal, CheckCircle, XCircle, Clock,
  AlertTriangle, User, Building, PieChart, Activity
} from "lucide-react"

interface Transaction {
  id: string
  userId: string
  userName: string
  type: 'deposit' | 'withdrawal' | 'fee' | 'commission' | 'refund'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  method: string
  description: string
  createdAt: string
  completedAt?: string
  fee: number
  reference?: string
}

interface FinancialStats {
  totalRevenue: number
  totalDeposits: number
  totalWithdrawals: number
  totalFees: number
  pendingTransactions: number
  monthlyGrowth: number
  activeUsers: number
  avgTransactionValue: number
}

interface CommissionData {
  userId: string
  userName: string
  totalCommission: number
  monthlyCommission: number
  referrals: number
  lastPayout: string
}

export default function AdminFinancial() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'tx_001',
      userId: 'user_001',
      userName: 'João Silva',
      type: 'deposit',
      amount: 1000.00,
      currency: 'USD',
      status: 'completed',
      method: 'PIX',
      description: 'Depósito via PIX',
      createdAt: '2025-07-28T10:30:00Z',
      completedAt: '2025-07-28T10:32:00Z',
      fee: 0,
      reference: 'PIX123456'
    },
    {
      id: 'tx_002',
      userId: 'user_002',
      userName: 'Maria Santos',
      type: 'withdrawal',
      amount: 500.00,
      currency: 'USD',
      status: 'pending',
      method: 'Bank Transfer',
      description: 'Saque para conta bancária',
      createdAt: '2025-07-28T09:15:00Z',
      fee: 5.00
    },
    {
      id: 'tx_003',
      userId: 'user_003',
      userName: 'Carlos Oliveira',
      type: 'fee',
      amount: 25.00,
      currency: 'USD',
      status: 'completed',
      method: 'Trading Fee',
      description: 'Taxa de trading - Pro Plan',
      createdAt: '2025-07-28T08:45:00Z',
      completedAt: '2025-07-28T08:45:00Z',
      fee: 0
    }
  ])

  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(transactions)
  const [commissions, setCommissions] = useState<CommissionData[]>([
    {
      userId: 'user_001',
      userName: 'João Silva',
      totalCommission: 2456.78,
      monthlyCommission: 345.60,
      referrals: 12,
      lastPayout: '2025-07-01T00:00:00Z'
    },
    {
      userId: 'user_002',
      userName: 'Maria Santos',
      totalCommission: 1234.50,
      monthlyCommission: 567.80,
      referrals: 8,
      lastPayout: '2025-07-01T00:00:00Z'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState('7d')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showTransactionDialog, setShowTransactionDialog] = useState(false)

  const [financialStats] = useState<FinancialStats>({
    totalRevenue: 127543.89,
    totalDeposits: 89234.56,
    totalWithdrawals: 45123.78,
    totalFees: 12876.34,
    pendingTransactions: 23,
    monthlyGrowth: 15.4,
    activeUsers: 892,
    avgTransactionValue: 342.67
  })

  useEffect(() => {
    let filtered = transactions

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(tx =>
        tx.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === typeFilter)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter)
    }

    setFilteredTransactions(filtered)
  }, [transactions, searchTerm, typeFilter, statusFilter])

  const handleUpdateTransactionStatus = async (transactionId: string, newStatus: Transaction['status']) => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setTransactions(prev => prev.map(tx => 
        tx.id === transactionId ? { 
          ...tx, 
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : tx.completedAt
        } : tx
      ))
      
      toast({
        title: "Sucesso!",
        description: "Status da transação atualizado",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcessCommissionPayout = async (userId: string) => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setCommissions(prev => prev.map(comm => 
        comm.userId === userId ? { 
          ...comm, 
          lastPayout: new Date().toISOString(),
          monthlyCommission: 0
        } : comm
      ))
      
      toast({
        title: "Sucesso!",
        description: "Comissão paga com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao processar pagamento",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'bg-green-100 text-green-800 border-green-200'
      case 'withdrawal': return 'bg-red-100 text-red-800 border-red-200'
      case 'fee': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'commission': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'refund': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="h-4 w-4" />
      case 'withdrawal': return <ArrowUpRight className="h-4 w-4" />
      case 'fee': return <Receipt className="h-4 w-4" />
      case 'commission': return <Wallet className="h-4 w-4" />
      case 'refund': return <RefreshCw className="h-4 w-4" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const exportData = () => {
    const csvData = filteredTransactions.map(tx => ({
      ID: tx.id,
      Usuario: tx.userName,
      Tipo: tx.type,
      Valor: tx.amount,
      Moeda: tx.currency,
      Status: tx.status,
      Metodo: tx.method,
      Taxa: tx.fee,
      Data: formatDate(tx.createdAt)
    }))

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transacoes_financeiras.csv'
    a.click()
  }

  return (
    <AdminLayout activeSection="financial">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão Financeira</h1>
            <p className="text-muted-foreground">
              Acompanhe transações, receitas e comissões
            </p>
          </div>
          
          <Button onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>

        {/* Financial Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(financialStats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                +{financialStats.monthlyGrowth}% este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Depósitos</CardTitle>
              <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(financialStats.totalDeposits)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(financialStats.avgTransactionValue)} média
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Saques</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(financialStats.totalWithdrawals)}</div>
              <p className="text-xs text-muted-foreground">
                {((financialStats.totalWithdrawals / financialStats.totalDeposits) * 100).toFixed(1)}% dos depósitos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transações Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{financialStats.pendingTransactions}</div>
              <p className="text-xs text-muted-foreground">
                Requer atenção
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Receita Mensal</CardTitle>
              <CardDescription>Evolução da receita nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <BarChart3 className="h-8 w-8 mr-2" />
                Gráfico de receita mensal
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Tipo</CardTitle>
              <CardDescription>Tipos de transações realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <PieChart className="h-8 w-8 mr-2" />
                Gráfico de distribuição
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
            <TabsTrigger value="commissions">Comissões</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros de Transações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por usuário, ID ou descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="deposit">Depósito</SelectItem>
                      <SelectItem value="withdrawal">Saque</SelectItem>
                      <SelectItem value="fee">Taxa</SelectItem>
                      <SelectItem value="commission">Comissão</SelectItem>
                      <SelectItem value="refund">Reembolso</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="failed">Falhou</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1d">Hoje</SelectItem>
                      <SelectItem value="7d">7 dias</SelectItem>
                      <SelectItem value="30d">30 dias</SelectItem>
                      <SelectItem value="90d">90 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Transações ({filteredTransactions.length})</CardTitle>
                <CardDescription>
                  Histórico completo de transações financeiras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID / Usuário</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{transaction.id}</div>
                              <div className="text-sm text-muted-foreground flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {transaction.userName}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge className={getTypeColor(transaction.type)}>
                              <span className="flex items-center">
                                {getTypeIcon(transaction.type)}
                                <span className="ml-1">
                                  {transaction.type === 'deposit' ? 'Depósito' :
                                   transaction.type === 'withdrawal' ? 'Saque' :
                                   transaction.type === 'fee' ? 'Taxa' :
                                   transaction.type === 'commission' ? 'Comissão' : 'Reembolso'}
                                </span>
                              </span>
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {formatCurrency(transaction.amount)}
                              </div>
                              {transaction.fee > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  Taxa: {formatCurrency(transaction.fee)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status === 'completed' ? 'Concluído' :
                               transaction.status === 'pending' ? 'Pendente' :
                               transaction.status === 'failed' ? 'Falhou' : 'Cancelado'}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm">{transaction.method}</div>
                            {transaction.reference && (
                              <div className="text-xs text-muted-foreground">
                                Ref: {transaction.reference}
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(transaction.createdAt)}
                            </div>
                            {transaction.completedAt && (
                              <div className="text-xs text-muted-foreground">
                                Concluído: {formatDate(transaction.completedAt)}
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedTransaction(transaction)
                                  setShowTransactionDialog(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              {transaction.status === 'pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUpdateTransactionStatus(transaction.id, 'completed')}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUpdateTransactionStatus(transaction.id, 'failed')}
                                    className="text-red-600"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Comissões</CardTitle>
                <CardDescription>
                  Comissões de afiliados e referências
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Comissão Total</TableHead>
                        <TableHead>Comissão Mensal</TableHead>
                        <TableHead>Referências</TableHead>
                        <TableHead>Último Pagamento</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((commission) => (
                        <TableRow key={commission.userId}>
                          <TableCell>
                            <div className="font-medium">{commission.userName}</div>
                            <div className="text-sm text-muted-foreground">{commission.userId}</div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="font-medium">
                              {formatCurrency(commission.totalCommission)}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="font-medium text-green-600">
                              {formatCurrency(commission.monthlyCommission)}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge variant="outline">
                              {commission.referrals} usuários
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(commission.lastPayout)}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleProcessCommissionPayout(commission.userId)}
                              disabled={commission.monthlyCommission <= 0 || isLoading}
                            >
                              <Wallet className="h-4 w-4 mr-2" />
                              Pagar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Relatório de Receitas</CardTitle>
                  <CardDescription>Análise detalhada de receitas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Receita Total:</span>
                      <span className="font-medium">{formatCurrency(financialStats.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa Média:</span>
                      <span className="font-medium">{formatCurrency(financialStats.totalFees)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Crescimento Mensal:</span>
                      <span className="font-medium text-green-600">+{financialStats.monthlyGrowth}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Relatório de Atividade</CardTitle>
                  <CardDescription>Métricas de atividade financeira</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Usuários Ativos:</span>
                      <span className="font-medium">{financialStats.activeUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor Médio:</span>
                      <span className="font-medium">{formatCurrency(financialStats.avgTransactionValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pendências:</span>
                      <span className="font-medium text-yellow-600">{financialStats.pendingTransactions}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Transaction Details Dialog */}
        <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes da Transação</DialogTitle>
              <DialogDescription>
                Informações completas da transação
              </DialogDescription>
            </DialogHeader>
            
            {selectedTransaction && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ID da Transação</Label>
                    <p className="text-sm font-medium">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <Label>Usuário</Label>
                    <p className="text-sm font-medium">{selectedTransaction.userName}</p>
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Badge className={getTypeColor(selectedTransaction.type)}>
                      {selectedTransaction.type}
                    </Badge>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className={getStatusColor(selectedTransaction.status)}>
                      {selectedTransaction.status}
                    </Badge>
                  </div>
                  <div>
                    <Label>Valor</Label>
                    <p className="text-sm font-medium">{formatCurrency(selectedTransaction.amount)}</p>
                  </div>
                  <div>
                    <Label>Taxa</Label>
                    <p className="text-sm font-medium">{formatCurrency(selectedTransaction.fee)}</p>
                  </div>
                </div>
                
                <div>
                  <Label>Descrição</Label>
                  <p className="text-sm">{selectedTransaction.description}</p>
                </div>
                
                {selectedTransaction.reference && (
                  <div>
                    <Label>Referência</Label>
                    <p className="text-sm font-mono">{selectedTransaction.reference}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
