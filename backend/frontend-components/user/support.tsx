'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { 
  MessageCircle, Phone, Mail, FileText, Search, 
  Clock, CheckCircle, AlertCircle, Send, Paperclip,
  ThumbsUp, ThumbsDown, Star, Download, ExternalLink,
  HelpCircle, Book, Video, Users, Zap, Shield
} from "lucide-react"

interface Ticket {
  id: string
  subject: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  createdAt: string
  updatedAt: string
  messages: Message[]
}

interface Message {
  id: string
  content: string
  sender: 'user' | 'support'
  timestamp: string
  attachments?: string[]
}

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  helpful: number
  notHelpful: number
  tags: string[]
}

export default function SupportCenter() {
  const [activeTab, setActiveTab] = useState('tickets')
  const [isLoading, setIsLoading] = useState(false)
  
  // Ticket Management
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'TICKET-001',
      subject: 'Problema com API da Binance',
      category: 'technical',
      priority: 'high',
      status: 'in_progress',
      createdAt: '2025-07-28T08:30:00Z',
      updatedAt: '2025-07-28T10:15:00Z',
      messages: [
        {
          id: 'msg1',
          content: 'Não consigo conectar minha API da Binance. Sempre retorna erro de autorização.',
          sender: 'user',
          timestamp: '2025-07-28T08:30:00Z'
        },
        {
          id: 'msg2',
          content: 'Olá! Vamos verificar sua configuração. Pode confirmar se as permissões estão habilitadas corretamente?',
          sender: 'support',
          timestamp: '2025-07-28T09:45:00Z'
        }
      ]
    },
    {
      id: 'TICKET-002',
      subject: 'Dúvida sobre configuração de risco',
      category: 'general',
      priority: 'medium',
      status: 'resolved',
      createdAt: '2025-07-27T14:20:00Z',
      updatedAt: '2025-07-27T16:30:00Z',
      messages: [
        {
          id: 'msg3',
          content: 'Qual é a configuração recomendada de stop loss para iniciantes?',
          sender: 'user',
          timestamp: '2025-07-27T14:20:00Z'
        },
        {
          id: 'msg4',
          content: 'Para iniciantes, recomendamos começar com 2-3% de stop loss e nunca mais que 1% de risco por trade.',
          sender: 'support',
          timestamp: '2025-07-27T15:10:00Z'
        }
      ]
    }
  ])

  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    message: ''
  })

  // FAQ
  const [faqs] = useState<FAQ[]>([
    {
      id: 'faq1',
      question: 'Como configurar uma API Key?',
      answer: 'Para configurar uma API Key: 1) Acesse a seção "API Keys" no menu, 2) Clique em "Adicionar Nova", 3) Selecione sua exchange, 4) Cole sua chave e configure as permissões necessárias.',
      category: 'setup',
      helpful: 45,
      notHelpful: 3,
      tags: ['api', 'configuração', 'exchange']
    },
    {
      id: 'faq2', 
      question: 'Qual o valor mínimo para começar a operar?',
      answer: 'Recomendamos um mínimo de $100-500 para começar. Valores menores podem limitar as estratégias devido às taxas das exchanges.',
      category: 'trading',
      helpful: 32,
      notHelpful: 8,
      tags: ['capital', 'iniciante', 'mínimo']
    },
    {
      id: 'faq3',
      question: 'Como funciona o modo de simulação?',
      answer: 'O modo simulação executa todas as estratégias sem usar dinheiro real. É perfeito para testar configurações e aprender sem riscos.',
      category: 'features',
      helpful: 67,
      notHelpful: 2,
      tags: ['simulação', 'teste', 'paper trading']
    },
    {
      id: 'faq4',
      question: 'Por que meu bot não está fazendo trades?',
      answer: 'Verifique: 1) Se o trading automatizado está ativado, 2) Se há saldo suficiente, 3) Se as condições de mercado atendem aos critérios da estratégia, 4) Se está dentro do horário configurado.',
      category: 'troubleshooting',
      helpful: 89,
      notHelpful: 12,
      tags: ['bot', 'automação', 'troubleshooting']
    }
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Live Chat
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: 'chat1',
      content: 'Olá! Como posso ajudá-lo hoje?',
      sender: 'support',
      timestamp: new Date().toISOString()
    }
  ])
  const [newChatMessage, setNewChatMessage] = useState('')

  useEffect(() => {
    const loadSupportData = async () => {
      setIsLoading(true)
      try {
        // Simulação de API call
        await new Promise(resolve => setTimeout(resolve, 800))
        console.log('✅ Dados de suporte carregados')
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error)
        toast({
          title: "Erro",
          description: "Falha ao carregar dados de suporte",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSupportData()
  }, [])

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.category || !newTicket.message) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // Simulação de API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const ticket: Ticket = {
        id: `TICKET-${tickets.length + 1}`.padStart(11, '0'),
        subject: newTicket.subject,
        category: newTicket.category,
        priority: newTicket.priority,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: `msg_${Date.now()}`,
            content: newTicket.message,
            sender: 'user',
            timestamp: new Date().toISOString()
          }
        ]
      }

      setTickets(prev => [ticket, ...prev])
      setNewTicket({ subject: '', category: '', priority: 'medium', message: '' })
      
      toast({
        title: "Sucesso!",
        description: `Ticket ${ticket.id} criado com sucesso`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar ticket",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendChatMessage = () => {
    if (!newChatMessage.trim()) return

    const message: Message = {
      id: `chat_${Date.now()}`,
      content: newChatMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    }

    setChatMessages(prev => [...prev, message])
    setNewChatMessage('')

    // Simular resposta do suporte
    setTimeout(() => {
      const response: Message = {
        id: `chat_${Date.now()}_response`,
        content: 'Obrigado pela sua mensagem! Um de nossos especialistas irá responder em breve.',
        sender: 'support',
        timestamp: new Date().toISOString()
      }
      setChatMessages(prev => [...prev, response])
    }, 2000)
  }

  const markFAQHelpful = (faqId: string, helpful: boolean) => {
    // Lógica para marcar FAQ como útil/não útil
    toast({
      title: helpful ? "Obrigado!" : "Feedback registrado",
      description: helpful ? "Sua avaliação nos ajuda a melhorar" : "Vamos trabalhar para melhorar este conteúdo",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Central de Suporte</h1>
          <p className="text-muted-foreground">
            Encontre respostas, abra tickets ou converse conosco em tempo real
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <Clock className="h-3 w-3 mr-1" />
            Online 24/7
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Users className="h-3 w-3 mr-1" />
            5 min resposta
          </Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('chat')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chat ao Vivo</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">
              Resposta em ~2 minutos
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('tickets')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meus Tickets</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground">
              {tickets.filter(t => t.status !== 'closed').length} abertos
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('faq')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base de Conhecimento</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{faqs.length}</div>
            <p className="text-xs text-muted-foreground">
              Artigos e tutoriais
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">100%</div>
            <p className="text-xs text-muted-foreground">
              Todos os serviços operacionais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tickets">
            <FileText className="h-4 w-4 mr-2" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="faq">
            <HelpCircle className="h-4 w-4 mr-2" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="resources">
            <Book className="h-4 w-4 mr-2" />
            Recursos
          </TabsTrigger>
        </TabsList>

        {/* Tickets Tab */}
        <TabsContent value="tickets">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Create New Ticket */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Abrir Novo Ticket</CardTitle>
                  <CardDescription>
                    Descreva seu problema detalhadamente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Assunto</Label>
                    <Input
                      id="subject"
                      placeholder="Descreva brevemente o problema"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={newTicket.category} onValueChange={(value) => setNewTicket({...newTicket, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Problema Técnico</SelectItem>
                        <SelectItem value="api">API / Integração</SelectItem>
                        <SelectItem value="trading">Trading / Estratégias</SelectItem>
                        <SelectItem value="billing">Faturamento</SelectItem>
                        <SelectItem value="general">Dúvida Geral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select value={newTicket.priority} onValueChange={(value: any) => setNewTicket({...newTicket, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Descrição Detalhada</Label>
                    <Textarea
                      id="message"
                      placeholder="Descreva o problema com o máximo de detalhes possível..."
                      value={newTicket.message}
                      onChange={(e) => setNewTicket({...newTicket, message: e.target.value})}
                      rows={4}
                    />
                  </div>

                  <Button onClick={handleCreateTicket} disabled={isLoading} className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    {isLoading ? 'Criando...' : 'Criar Ticket'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Ticket List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Meus Tickets</CardTitle>
                  <CardDescription>
                    Acompanhe o status dos seus chamados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tickets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum ticket aberto</p>
                      <p className="text-sm">Crie um ticket para obter suporte</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tickets.map((ticket) => (
                        <div key={ticket.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{ticket.subject}</h3>
                              <p className="text-sm text-muted-foreground">#{ticket.id}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {ticket.priority === 'low' ? 'Baixa' :
                                 ticket.priority === 'medium' ? 'Média' :
                                 ticket.priority === 'high' ? 'Alta' : 'Urgente'}
                              </Badge>
                              <Badge className={getStatusColor(ticket.status)}>
                                {ticket.status === 'open' ? 'Aberto' :
                                 ticket.status === 'in_progress' ? 'Em Andamento' :
                                 ticket.status === 'resolved' ? 'Resolvido' : 'Fechado'}
                              </Badge>
                            </div>
                          </div>

                          <div className="text-sm text-muted-foreground">
                            <p>Categoria: {ticket.category === 'technical' ? 'Técnico' :
                                         ticket.category === 'api' ? 'API' :
                                         ticket.category === 'trading' ? 'Trading' :
                                         ticket.category === 'billing' ? 'Faturamento' : 'Geral'}</p>
                            <p>Criado: {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</p>
                            <p>Última atualização: {new Date(ticket.updatedAt).toLocaleDateString('pt-BR')}</p>
                          </div>

                          <div className="pt-2 border-t">
                            <p className="text-sm">
                              <strong>Última mensagem:</strong> {ticket.messages[ticket.messages.length - 1]?.content.substring(0, 100)}...
                            </p>
                          </div>

                          <div className="flex justify-end">
                            <Button variant="outline" size="sm">
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq">
          <div className="space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardHeader>
                <CardTitle>Pesquisar na Base de Conhecimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar por pergunta, resposta ou tag..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      <SelectItem value="setup">Configuração</SelectItem>
                      <SelectItem value="trading">Trading</SelectItem>
                      <SelectItem value="features">Funcionalidades</SelectItem>
                      <SelectItem value="troubleshooting">Solução de Problemas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Results */}
            <div className="space-y-4">
              {filteredFAQs.map((faq) => (
                <Card key={faq.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{faq.question}</CardTitle>
                      <Badge variant="outline" className="capitalize">
                        {faq.category === 'setup' ? 'Configuração' :
                         faq.category === 'trading' ? 'Trading' :
                         faq.category === 'features' ? 'Funcionalidades' : 'Problemas'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{faq.answer}</p>
                    
                    <div className="flex flex-wrap gap-1">
                      {faq.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">Este artigo foi útil?</span>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markFAQHelpful(faq.id, true)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {faq.helpful}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markFAQHelpful(faq.id, false)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            {faq.notHelpful}
                          </Button>
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Artigo Completo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredFAQs.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Nenhum resultado encontrado</p>
                  <p className="text-sm text-muted-foreground">Tente ajustar sua busca ou abra um ticket</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chat ao Vivo</CardTitle>
                  <CardDescription>
                    Converse diretamente com nossa equipe de suporte
                  </CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Online
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-muted/20 rounded">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendChatMessage} disabled={!newChatMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Documentation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Book className="h-5 w-5 mr-2" />
                  Documentação
                </CardTitle>
                <CardDescription>
                  Guias completos e referências técnicas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Guia de Primeiros Passos
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Configuração de API
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Estratégias de Trading
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Gerenciamento de Risco
                </Button>
              </CardContent>
            </Card>

            {/* Video Tutorials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Video className="h-5 w-5 mr-2" />
                  Tutoriais em Vídeo
                </CardTitle>
                <CardDescription>
                  Aprenda visualmente com nossos tutoriais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <Video className="h-4 w-4 mr-2" />
                  Configuração Inicial
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Video className="h-4 w-4 mr-2" />
                  Criando Estratégias
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Video className="h-4 w-4 mr-2" />
                  Monitoramento de Trades
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Video className="h-4 w-4 mr-2" />
                  Análise de Performance
                </Button>
              </CardContent>
            </Card>

            {/* Community */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Comunidade
                </CardTitle>
                <CardDescription>
                  Conecte-se com outros traders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Discord Server
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Telegram Group
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Forum da Comunidade
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Canal YouTube
                </Button>
              </CardContent>
            </Card>

            {/* Downloads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2" />
                  Downloads
                </CardTitle>
                <CardDescription>
                  Recursos e ferramentas úteis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Planilha de Controle
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Calculadora de Risco
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Templates de Estratégia
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Backup de Configurações
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Status do Sistema
                </CardTitle>
                <CardDescription>
                  Monitoramento em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Trading</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operacional
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Exchanges</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operacional
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Dashboard</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operacional
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notificações</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Operacional
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  Contato Direto
                </CardTitle>
                <CardDescription>
                  Para emergências e casos urgentes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">support@coinbitclub.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">+55 11 99999-0000</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">24/7 - Todos os dias</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
