import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Key,
  Plus,
  MoreVertical,
  Eye,
  EyeOff,
  Copy,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Globe,
  Shield,
  Calendar,
  TrendingUp,
  Download,
  Search,
  Filter,
  BarChart3,
  Zap,
  Lock,
  Unlock,
  Settings,
  Info
} from 'lucide-react';

interface APIKey {
  id: string;
  name: string;
  key: string;
  secret: string;
  exchange: string;
  status: 'active' | 'inactive' | 'expired' | 'revoked';
  permissions: string[];
  createdAt: string;
  lastUsed: string;
  expiresAt: string;
  description: string;
  ipWhitelist: string[];
  usageStats: {
    totalRequests: number;
    requestsToday: number;
    rateLimitHits: number;
    errorRate: number;
  };
  trading: {
    enabled: boolean;
    maxOrderSize: number;
    allowedPairs: string[];
    restrictions: string[];
  };
}

interface Exchange {
  id: string;
  name: string;
  logo: string;
  supported: boolean;
  features: string[];
  testnetAvailable: boolean;
}

const APIKeysManagement: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterExchange, setFilterExchange] = useState('all');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  
  const [newKeyForm, setNewKeyForm] = useState({
    name: '',
    exchange: '',
    key: '',
    secret: '',
    description: '',
    permissions: [] as string[],
    ipWhitelist: '',
    expiresAt: '',
    trading: {
      enabled: false,
      maxOrderSize: 1000,
      allowedPairs: [] as string[],
      restrictions: [] as string[]
    }
  });

  // Mock data
  const mockExchanges: Exchange[] = [
    {
      id: 'binance',
      name: 'Binance',
      logo: '/exchanges/binance.png',
      supported: true,
      features: ['spot', 'futures', 'margin'],
      testnetAvailable: true
    },
    {
      id: 'coinbase',
      name: 'Coinbase Pro',
      logo: '/exchanges/coinbase.png',
      supported: true,
      features: ['spot'],
      testnetAvailable: true
    },
    {
      id: 'kraken',
      name: 'Kraken',
      logo: '/exchanges/kraken.png',
      supported: true,
      features: ['spot', 'futures'],
      testnetAvailable: false
    },
    {
      id: 'bybit',
      name: 'Bybit',
      logo: '/exchanges/bybit.png',
      supported: true,
      features: ['spot', 'futures'],
      testnetAvailable: true
    }
  ];

  const mockAPIKeys: APIKey[] = [
    {
      id: '1',
      name: 'Binance Principal',
      key: 'abcd1234efgh5678ijkl9012mnop3456',
      secret: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      exchange: 'binance',
      status: 'active',
      permissions: ['read', 'trade', 'withdraw'],
      createdAt: '2025-07-15T10:00:00Z',
      lastUsed: '2025-07-28T14:30:00Z',
      expiresAt: '2026-07-15T10:00:00Z',
      description: 'Chave principal para trading automático na Binance',
      ipWhitelist: ['192.168.1.100', '10.0.0.50'],
      usageStats: {
        totalRequests: 15420,
        requestsToday: 234,
        rateLimitHits: 12,
        errorRate: 0.02
      },
      trading: {
        enabled: true,
        maxOrderSize: 5000,
        allowedPairs: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'],
        restrictions: ['no_margin']
      }
    },
    {
      id: '2',
      name: 'Coinbase Backup',
      key: 'qwer5678tyui9012asdf3456zxcv7890',
      secret: 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
      exchange: 'coinbase',
      status: 'inactive',
      permissions: ['read'],
      createdAt: '2025-07-20T15:30:00Z',
      lastUsed: '2025-07-25T09:15:00Z',
      expiresAt: '2026-01-20T15:30:00Z',
      description: 'Chave backup para monitoramento',
      ipWhitelist: [],
      usageStats: {
        totalRequests: 3250,
        requestsToday: 0,
        rateLimitHits: 0,
        errorRate: 0.01
      },
      trading: {
        enabled: false,
        maxOrderSize: 0,
        allowedPairs: [],
        restrictions: ['read_only']
      }
    },
    {
      id: '3',
      name: 'Kraken Test',
      key: 'test1234567890abcdefghijklmnopqrst',
      secret: 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ',
      exchange: 'kraken',
      status: 'expired',
      permissions: ['read', 'trade'],
      createdAt: '2025-06-01T08:00:00Z',
      lastUsed: '2025-07-01T12:00:00Z',
      expiresAt: '2025-07-01T08:00:00Z',
      description: 'Chave de teste expirada',
      ipWhitelist: ['192.168.1.100'],
      usageStats: {
        totalRequests: 890,
        requestsToday: 0,
        rateLimitHits: 45,
        errorRate: 0.15
      },
      trading: {
        enabled: false,
        maxOrderSize: 100,
        allowedPairs: ['BTCEUR'],
        restrictions: ['testnet_only']
      }
    }
  ];

  useEffect(() => {
    fetchAPIKeys();
    fetchExchanges();
  }, []);

  const fetchAPIKeys = async () => {
    try {
      setLoading(true);
      // In production: const response = await fetch('/api/user/api-keys');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setApiKeys(mockAPIKeys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExchanges = async () => {
    try {
      // In production: const response = await fetch('/api/exchanges');
      await new Promise(resolve => setTimeout(resolve, 500));
      setExchanges(mockExchanges);
    } catch (error) {
      console.error('Error fetching exchanges:', error);
    }
  };

  const handleCreateKey = async () => {
    try {
      setSaving(true);
      // In production: await fetch('/api/user/api-keys', { method: 'POST', body: JSON.stringify(newKeyForm) });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newKey: APIKey = {
        id: Date.now().toString(),
        ...newKeyForm,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastUsed: '',
        ipWhitelist: newKeyForm.ipWhitelist ? newKeyForm.ipWhitelist.split(',').map(ip => ip.trim()) : [],
        usageStats: {
          totalRequests: 0,
          requestsToday: 0,
          rateLimitHits: 0,
          errorRate: 0
        }
      };
      
      setApiKeys(prev => [...prev, newKey]);
      setShowCreateDialog(false);
      setNewKeyForm({
        name: '',
        exchange: '',
        key: '',
        secret: '',
        description: '',
        permissions: [],
        ipWhitelist: '',
        expiresAt: '',
        trading: {
          enabled: false,
          maxOrderSize: 1000,
          allowedPairs: [],
          restrictions: []
        }
      });
      
      console.log('API key created successfully');
    } catch (error) {
      console.error('Error creating API key:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateKey = async () => {
    if (!selectedKey) return;
    
    try {
      setSaving(true);
      // In production: await fetch(`/api/user/api-keys/${selectedKey.id}`, { method: 'PUT', body: JSON.stringify(selectedKey) });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setApiKeys(prev => prev.map(key => key.id === selectedKey.id ? selectedKey : key));
      setShowEditDialog(false);
      setSelectedKey(null);
      
      console.log('API key updated successfully');
    } catch (error) {
      console.error('Error updating API key:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta chave API? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      setSaving(true);
      // In production: await fetch(`/api/user/api-keys/${keyId}`, { method: 'DELETE' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      
      console.log('API key deleted successfully');
    } catch (error) {
      console.error('Error deleting API key:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (keyId: string) => {
    try {
      setSaving(true);
      const key = apiKeys.find(k => k.id === keyId);
      if (!key) return;
      
      const newStatus = key.status === 'active' ? 'inactive' : 'active';
      
      // In production: await fetch(`/api/user/api-keys/${keyId}/toggle`, { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setApiKeys(prev => prev.map(k => k.id === keyId ? { ...k, status: newStatus } : k));
      
      console.log(`API key ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling API key status:', error);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    console.log('Copied to clipboard');
  };

  const toggleSecretVisibility = (keyId: string) => {
    setShowSecrets(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'expired': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'revoked': return <Lock className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'inactive': return 'bg-yellow-600';
      case 'expired': return 'bg-red-600';
      case 'revoked': return 'bg-red-800';
      default: return 'bg-gray-600';
    }
  };

  const getExchangeName = (exchangeId: string) => {
    const exchange = exchanges.find(ex => ex.id === exchangeId);
    return exchange?.name || exchangeId;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpiringSoon = (expiresAt: string) => {
    if (!expiresAt) return false;
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const filteredKeys = apiKeys.filter(key => {
    const matchesSearch = key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         key.exchange.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || key.status === filterStatus;
    const matchesExchange = filterExchange === 'all' || key.exchange === filterExchange;
    
    return matchesSearch && matchesStatus && matchesExchange;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-yellow-400 mx-auto mb-4" />
          <p className="text-white">Carregando chaves API...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
            Gerenciamento de API Keys
          </h1>
          <p className="text-gray-400 mt-1">
            Configure e monitore suas chaves de API das exchanges para trading automático.
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-600 hover:bg-yellow-700 text-black">
              <Plus className="h-4 w-4 mr-2" />
              Nova Chave API
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Chave API</DialogTitle>
              <DialogDescription>
                Configure uma nova chave API para conectar sua exchange ao sistema de trading.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="keyName">Nome da Chave</Label>
                  <Input
                    id="keyName"
                    value={newKeyForm.name}
                    onChange={(e) => setNewKeyForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Binance Principal"
                    className="bg-gray-800 border-gray-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="exchange">Exchange</Label>
                  <Select 
                    value={newKeyForm.exchange} 
                    onValueChange={(value) => setNewKeyForm(prev => ({ ...prev, exchange: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600">
                      <SelectValue placeholder="Selecione a exchange" />
                    </SelectTrigger>
                    <SelectContent>
                      {exchanges.filter(ex => ex.supported).map(exchange => (
                        <SelectItem key={exchange.id} value={exchange.id}>
                          {exchange.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  value={newKeyForm.key}
                  onChange={(e) => setNewKeyForm(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="Cole sua API Key aqui"
                  className="bg-gray-800 border-gray-600"
                />
              </div>
              
              <div>
                <Label htmlFor="secretKey">Secret Key</Label>
                <Input
                  id="secretKey"
                  type="password"
                  value={newKeyForm.secret}
                  onChange={(e) => setNewKeyForm(prev => ({ ...prev, secret: e.target.value }))}
                  placeholder="Cole sua Secret Key aqui"
                  className="bg-gray-800 border-gray-600"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newKeyForm.description}
                  onChange={(e) => setNewKeyForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o propósito desta chave API"
                  className="bg-gray-800 border-gray-600"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="permissions">Permissões</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {['read', 'trade', 'withdraw'].map(permission => (
                    <label key={permission} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newKeyForm.permissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewKeyForm(prev => ({ 
                              ...prev, 
                              permissions: [...prev.permissions, permission] 
                            }));
                          } else {
                            setNewKeyForm(prev => ({ 
                              ...prev, 
                              permissions: prev.permissions.filter(p => p !== permission) 
                            }));
                          }
                        }}
                        className="rounded border-gray-600"
                      />
                      <span className="text-sm capitalize">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="ipWhitelist">Whitelist de IPs (opcional)</Label>
                <Input
                  id="ipWhitelist"
                  value={newKeyForm.ipWhitelist}
                  onChange={(e) => setNewKeyForm(prev => ({ ...prev, ipWhitelist: e.target.value }))}
                  placeholder="192.168.1.100, 10.0.0.50"
                  className="bg-gray-800 border-gray-600"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Separe múltiplos IPs com vírgulas
                </p>
              </div>
              
              <div>
                <Label htmlFor="expiresAt">Data de Expiração (opcional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={newKeyForm.expiresAt}
                  onChange={(e) => setNewKeyForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="bg-gray-800 border-gray-600"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newKeyForm.trading.enabled}
                    onCheckedChange={(checked) => 
                      setNewKeyForm(prev => ({ 
                        ...prev, 
                        trading: { ...prev.trading, enabled: checked } 
                      }))
                    }
                  />
                  <Label>Habilitar Trading</Label>
                </div>
                
                {newKeyForm.trading.enabled && (
                  <div>
                    <Label htmlFor="maxOrderSize">Tamanho Máximo da Ordem (USD)</Label>
                    <Input
                      id="maxOrderSize"
                      type="number"
                      value={newKeyForm.trading.maxOrderSize}
                      onChange={(e) => setNewKeyForm(prev => ({ 
                        ...prev, 
                        trading: { ...prev.trading, maxOrderSize: Number(e.target.value) } 
                      }))}
                      className="bg-gray-800 border-gray-600"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                className="border-gray-600"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateKey}
                disabled={saving || !newKeyForm.name || !newKeyForm.exchange || !newKeyForm.key || !newKeyForm.secret}
                className="bg-yellow-600 hover:bg-yellow-700 text-black"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Chave API'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {apiKeys.some(key => isExpiringSoon(key.expiresAt)) && (
        <Alert className="border-yellow-500 bg-yellow-950/50 mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você tem {apiKeys.filter(key => isExpiringSoon(key.expiresAt)).length} chave(s) API que expira(m) em breve. 
            Considere renovar para evitar interrupções no trading.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou exchange..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-600">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
                <SelectItem value="revoked">Revogado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterExchange} onValueChange={setFilterExchange}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-600">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Exchanges</SelectItem>
                {exchanges.map(exchange => (
                  <SelectItem key={exchange.id} value={exchange.id}>
                    {exchange.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="border-gray-600">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Keys List */}
      <div className="space-y-4">
        {filteredKeys.length === 0 ? (
          <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
            <CardContent className="p-8 text-center">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">Nenhuma chave API encontrada</h3>
              <p className="text-gray-400 mb-4">
                {searchTerm || filterStatus !== 'all' || filterExchange !== 'all' 
                  ? 'Nenhuma chave corresponde aos filtros aplicados.'
                  : 'Você ainda não criou nenhuma chave API. Crie sua primeira chave para começar o trading automático.'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && filterExchange === 'all' && (
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-black"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Chave API
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredKeys.map((apiKey) => (
            <Card key={apiKey.id} className="bg-black/80 backdrop-blur-sm border-blue-400/30">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg flex items-center justify-center">
                      <Key className="h-6 w-6 text-black" />
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium">{apiKey.name}</h3>
                        
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(apiKey.status)}
                          <Badge className={`${getStatusColor(apiKey.status)} text-white text-xs`}>
                            {apiKey.status}
                          </Badge>
                        </div>
                        
                        <Badge variant="outline" className="border-blue-400 text-blue-400">
                          {getExchangeName(apiKey.exchange)}
                        </Badge>
                        
                        {apiKey.trading.enabled && (
                          <Badge className="bg-green-600 text-white">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Trading
                          </Badge>
                        )}
                        
                        {isExpiringSoon(apiKey.expiresAt) && (
                          <Badge className="bg-yellow-600 text-black">
                            <Clock className="h-3 w-3 mr-1" />
                            Expira em breve
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-2">{apiKey.description}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span>Criado: {formatDate(apiKey.createdAt)}</span>
                        <span>Último uso: {formatDate(apiKey.lastUsed)}</span>
                        {apiKey.expiresAt && (
                          <span>Expira: {formatDate(apiKey.expiresAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedKey(apiKey);
                          setShowEditDialog(true);
                        }}
                        className="text-white hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleToggleStatus(apiKey.id)}
                        disabled={saving}
                        className="text-white hover:bg-gray-700"
                      >
                        {apiKey.status === 'active' ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Unlock className="h-4 w-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteKey(apiKey.id)}
                        disabled={saving}
                        className="text-red-400 hover:bg-red-900"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* API Key Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-gray-400">API Key</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          value={apiKey.key}
                          readOnly
                          className="bg-gray-800 border-gray-600 text-sm font-mono"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(apiKey.key)}
                          className="border-gray-600"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-400">Secret Key</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          value={showSecrets[apiKey.id] ? apiKey.secret : '••••••••••••••••••••••••••••••••'}
                          readOnly
                          className="bg-gray-800 border-gray-600 text-sm font-mono"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleSecretVisibility(apiKey.id)}
                          className="border-gray-600"
                        >
                          {showSecrets[apiKey.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(apiKey.secret)}
                          className="border-gray-600"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-400">Permissões</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {apiKey.permissions.map(permission => (
                          <Badge key={permission} variant="outline" className="border-gray-600 text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {apiKey.ipWhitelist.length > 0 && (
                      <div>
                        <Label className="text-xs text-gray-400">IPs Permitidos</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {apiKey.ipWhitelist.map(ip => (
                            <Badge key={ip} variant="outline" className="border-gray-600 text-xs font-mono">
                              {ip}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-gray-400">Estatísticas de Uso</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <Activity className="h-4 w-4 text-blue-400" />
                            <span className="text-xs text-gray-400">Total</span>
                          </div>
                          <p className="text-lg font-medium">{apiKey.usageStats.totalRequests.toLocaleString()}</p>
                        </div>
                        
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <Zap className="h-4 w-4 text-green-400" />
                            <span className="text-xs text-gray-400">Hoje</span>
                          </div>
                          <p className="text-lg font-medium">{apiKey.usageStats.requestsToday}</p>
                        </div>
                        
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="h-4 w-4 text-yellow-400" />
                            <span className="text-xs text-gray-400">Rate Limits</span>
                          </div>
                          <p className="text-lg font-medium">{apiKey.usageStats.rateLimitHits}</p>
                        </div>
                        
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4 text-red-400" />
                            <span className="text-xs text-gray-400">Erro %</span>
                          </div>
                          <p className="text-lg font-medium">{(apiKey.usageStats.errorRate * 100).toFixed(2)}%</p>
                        </div>
                      </div>
                    </div>
                    
                    {apiKey.trading.enabled && (
                      <div>
                        <Label className="text-xs text-gray-400">Configurações de Trading</Label>
                        <div className="bg-gray-800/50 rounded-lg p-3 mt-2 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Tamanho máx. ordem:</span>
                            <span>${apiKey.trading.maxOrderSize.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Pares permitidos:</span>
                            <span>{apiKey.trading.allowedPairs.length || 'Todos'}</span>
                          </div>
                          {apiKey.trading.restrictions.length > 0 && (
                            <div>
                              <span className="text-xs text-gray-400">Restrições:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {apiKey.trading.restrictions.map(restriction => (
                                  <Badge key={restriction} className="bg-red-600 text-white text-xs">
                                    {restriction}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Chave API</DialogTitle>
            <DialogDescription>
              Atualize as configurações da sua chave API.
            </DialogDescription>
          </DialogHeader>
          
          {selectedKey && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <Label htmlFor="editName">Nome da Chave</Label>
                <Input
                  id="editName"
                  value={selectedKey.name}
                  onChange={(e) => setSelectedKey(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="bg-gray-800 border-gray-600"
                />
              </div>
              
              <div>
                <Label htmlFor="editDescription">Descrição</Label>
                <Textarea
                  id="editDescription"
                  value={selectedKey.description}
                  onChange={(e) => setSelectedKey(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="bg-gray-800 border-gray-600"
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Permissões</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {['read', 'trade', 'withdraw'].map(permission => (
                    <label key={permission} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedKey.permissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedKey(prev => prev ? { 
                              ...prev, 
                              permissions: [...prev.permissions, permission] 
                            } : null);
                          } else {
                            setSelectedKey(prev => prev ? { 
                              ...prev, 
                              permissions: prev.permissions.filter(p => p !== permission) 
                            } : null);
                          }
                        }}
                        className="rounded border-gray-600"
                      />
                      <span className="text-sm capitalize">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={selectedKey.trading.enabled}
                    onCheckedChange={(checked) => 
                      setSelectedKey(prev => prev ? { 
                        ...prev, 
                        trading: { ...prev.trading, enabled: checked } 
                      } : null)
                    }
                  />
                  <Label>Habilitar Trading</Label>
                </div>
                
                {selectedKey.trading.enabled && (
                  <div>
                    <Label htmlFor="editMaxOrderSize">Tamanho Máximo da Ordem (USD)</Label>
                    <Input
                      id="editMaxOrderSize"
                      type="number"
                      value={selectedKey.trading.maxOrderSize}
                      onChange={(e) => setSelectedKey(prev => prev ? { 
                        ...prev, 
                        trading: { ...prev.trading, maxOrderSize: Number(e.target.value) } 
                      } : null)}
                      className="bg-gray-800 border-gray-600"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditDialog(false);
                setSelectedKey(null);
              }}
              className="border-gray-600"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateKey}
              disabled={saving}
              className="bg-yellow-600 hover:bg-yellow-700 text-black"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default APIKeysManagement;
