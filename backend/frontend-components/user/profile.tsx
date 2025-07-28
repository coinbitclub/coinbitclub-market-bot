import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  User,
  Camera,
  Shield,
  Bell,
  Globe,
  Clock,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Upload,
  Check,
  X,
  AlertCircle,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  Settings,
  Save,
  RefreshCw,
  Download,
  Trash2,
  Key
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
  avatar: string;
  verified: boolean;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  plan: 'basic' | 'premium' | 'pro';
  timezone: string;
  language: string;
  currency: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    trading: boolean;
    security: boolean;
    marketing: boolean;
  };
  security: {
    lastPasswordChange: string;
    activeSessions: number;
    loginHistory: Array<{
      ip: string;
      location: string;
      device: string;
      timestamp: string;
    }>;
  };
}

interface Document {
  id: string;
  type: 'passport' | 'driver_license' | 'id_card' | 'proof_of_address';
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  url: string;
}

const UserProfile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [twoFactorDialog, setTwoFactorDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({});

  // Mock data
  const mockProfile: UserProfile = {
    id: '1',
    email: 'joao.silva@email.com',
    firstName: 'João',
    lastName: 'Silva',
    phone: '+5511999887766',
    birthDate: '1990-05-15',
    country: 'Brasil',
    city: 'São Paulo',
    address: 'Rua das Flores, 123',
    postalCode: '01234-567',
    avatar: '',
    verified: true,
    twoFactorEnabled: false,
    emailVerified: true,
    phoneVerified: true,
    kycStatus: 'approved',
    plan: 'premium',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    currency: 'USD',
    notifications: {
      email: true,
      sms: true,
      push: true,
      trading: true,
      security: true,
      marketing: false
    },
    security: {
      lastPasswordChange: '2025-07-01T10:00:00Z',
      activeSessions: 3,
      loginHistory: [
        {
          ip: '192.168.1.100',
          location: 'São Paulo, Brasil',
          device: 'Chrome - Windows',
          timestamp: '2025-07-28T10:30:00Z'
        },
        {
          ip: '192.168.1.101',
          location: 'São Paulo, Brasil',
          device: 'Mobile App - Android',
          timestamp: '2025-07-27T15:20:00Z'
        }
      ]
    }
  };

  const mockDocuments: Document[] = [
    {
      id: '1',
      type: 'passport',
      status: 'approved',
      uploadedAt: '2025-07-15T10:00:00Z',
      url: '/documents/passport.jpg'
    },
    {
      id: '2',
      type: 'proof_of_address',
      status: 'pending',
      uploadedAt: '2025-07-28T09:00:00Z',
      url: '/documents/address.pdf'
    }
  ];

  useEffect(() => {
    fetchProfile();
    fetchDocuments();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // In production: const response = await fetch('/api/user/profile');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProfile(mockProfile);
      setProfileForm(mockProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      // In production: const response = await fetch('/api/user/documents');
      await new Promise(resolve => setTimeout(resolve, 500));
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      // In production: await fetch('/api/user/profile', { method: 'PUT', body: JSON.stringify(profileForm) });
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProfile({ ...profile!, ...profileForm });
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      // In production: FormData upload to /api/user/upload/avatar
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newAvatarUrl = URL.createObjectURL(file);
      setProfileForm(prev => ({ ...prev, avatar: newAvatarUrl }));
      console.log('Avatar uploaded successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentUpload = async (type: string, file: File) => {
    try {
      setUploading(true);
      // In production: FormData upload to /api/user/upload/document
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newDocument: Document = {
        id: Date.now().toString(),
        type: type as any,
        status: 'pending',
        uploadedAt: new Date().toISOString(),
        url: URL.createObjectURL(file)
      };
      setDocuments(prev => [...prev, newDocument]);
      console.log('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      console.error('Passwords do not match');
      return;
    }

    try {
      setSaving(true);
      // In production: await fetch('/api/user/change-password', { method: 'POST', body: JSON.stringify(passwordForm) });
      await new Promise(resolve => setTimeout(resolve, 2000));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      console.log('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      setSaving(true);
      // In production: await fetch('/api/user/enable-2fa', { method: 'POST', body: JSON.stringify({ code: verificationCode }) });
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProfile(prev => ({ ...prev!, twoFactorEnabled: true }));
      setTwoFactorDialog(false);
      setVerificationCode('');
      console.log('2FA enabled successfully');
    } catch (error) {
      console.error('Error enabling 2FA:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Check className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected': return <X className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-600';
      case 'pending': return 'bg-yellow-600';
      case 'rejected': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-gray-600';
      case 'premium': return 'bg-yellow-600';
      case 'pro': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-yellow-400 mx-auto mb-4" />
          <p className="text-white">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
            Meu Perfil
          </h1>
          <p className="text-gray-400 mt-1">
            Gerencie suas informações pessoais e configurações de segurança.
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge className={`${getPlanBadgeColor(profile.plan)} text-white`}>
            {profile.plan.toUpperCase()}
          </Badge>
          
          {profile.verified && (
            <Badge className="bg-green-600 text-white">
              <Check className="h-3 w-3 mr-1" />
              Verificado
            </Badge>
          )}
        </div>
      </div>

      {/* Profile Overview */}
      <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30 mb-8">
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileForm.avatar || profile.avatar} alt={profile.firstName} />
                <AvatarFallback className="bg-yellow-600 text-black font-bold text-xl">
                  {profile.firstName[0]}{profile.lastName[0]}
                </AvatarFallback>
              </Avatar>
              
              <label className="absolute bottom-0 right-0 bg-yellow-600 hover:bg-yellow-700 rounded-full p-2 cursor-pointer transition-colors">
                <Camera className="h-4 w-4 text-black" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h2>
              <p className="text-gray-400">{profile.email}</p>
              
              <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">
                    {profile.emailVerified ? 'Email verificado' : 'Email não verificado'}
                  </span>
                  {profile.emailVerified && <Check className="h-4 w-4 text-green-500" />}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-green-400" />
                  <span className="text-sm">
                    {profile.phoneVerified ? 'Telefone verificado' : 'Telefone não verificado'}
                  </span>
                  {profile.phoneVerified && <Check className="h-4 w-4 text-green-500" />}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-purple-400" />
                  <span className="text-sm">
                    {profile.twoFactorEnabled ? '2FA ativado' : '2FA desativado'}
                  </span>
                  {profile.twoFactorEnabled && <Check className="h-4 w-4 text-green-500" />}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-black/60">
          <TabsTrigger value="personal">Informações Pessoais</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="personal" className="space-y-6">
          <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-yellow-400" />
                <span>Informações Pessoais</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    value={profileForm.firstName || ''}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    value={profileForm.lastName || ''}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email || ''}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profileForm.phone || ''}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={profileForm.birthDate || ''}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, birthDate: e.target.value }))}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="country">País</Label>
                  <Select 
                    value={profileForm.country || ''} 
                    onValueChange={(value) => setProfileForm(prev => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600">
                      <SelectValue placeholder="Selecione o país" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Brasil">Brasil</SelectItem>
                      <SelectItem value="Estados Unidos">Estados Unidos</SelectItem>
                      <SelectItem value="Portugal">Portugal</SelectItem>
                      <SelectItem value="Espanha">Espanha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={profileForm.address || ''}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                  className="bg-gray-800 border-gray-600"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={profileForm.city || ''}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="postalCode">CEP</Label>
                  <Input
                    id="postalCode"
                    value={profileForm.postalCode || ''}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, postalCode: e.target.value }))}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="bg-yellow-600 hover:bg-yellow-700 text-black"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Password Change */}
            <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-yellow-400" />
                  <span>Alterar Senha</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="bg-gray-800 border-gray-600 pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-auto"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="bg-gray-800 border-gray-600"
                  />
                </div>
                
                <Button 
                  onClick={handlePasswordChange}
                  disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Alterar Senha
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-yellow-400" />
                  <span>Autenticação em Duas Etapas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">2FA Status</p>
                    <p className="text-sm text-gray-400">
                      {profile.twoFactorEnabled ? 'Ativado' : 'Desativado'}
                    </p>
                  </div>
                  <Badge className={profile.twoFactorEnabled ? 'bg-green-600' : 'bg-red-600'}>
                    {profile.twoFactorEnabled ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                
                {!profile.twoFactorEnabled ? (
                  <Dialog open={twoFactorDialog} onOpenChange={setTwoFactorDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <Shield className="h-4 w-4 mr-2" />
                        Ativar 2FA
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700">
                      <DialogHeader>
                        <DialogTitle>Ativar Autenticação em Duas Etapas</DialogTitle>
                        <DialogDescription>
                          Escaneie o QR code com seu app autenticador e digite o código de verificação.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center">
                            <span className="text-black text-sm">QR Code Placeholder</span>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="verificationCode">Código de Verificação</Label>
                          <Input
                            id="verificationCode"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder="123456"
                            className="bg-gray-800 border-gray-600"
                          />
                        </div>
                        
                        <Button 
                          onClick={handleEnable2FA}
                          disabled={saving || verificationCode.length !== 6}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          {saving ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Ativando...
                            </>
                          ) : (
                            'Ativar 2FA'
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Desativar 2FA
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Login History */}
          <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-400" />
                  <span>Histórico de Login</span>
                </div>
                <span className="text-sm text-gray-400">
                  {profile.security.activeSessions} sessões ativas
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.security.loginHistory.map((login, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">{login.device}</p>
                        <p className="text-sm text-gray-400">{login.location} • {login.ip}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{new Date(login.timestamp).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400">{new Date(login.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="space-y-6">
          <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-yellow-400" />
                <span>Documentos de Verificação</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-blue-500 bg-blue-950/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Para usar todas as funcionalidades da plataforma, você precisa verificar sua identidade enviando os documentos necessários.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['passport', 'driver_license', 'id_card', 'proof_of_address'].map((docType) => {
                  const document = documents.find(doc => doc.type === docType);
                  const labels = {
                    passport: 'Passaporte',
                    driver_license: 'Carteira de Motorista',
                    id_card: 'RG/CPF',
                    proof_of_address: 'Comprovante de Endereço'
                  };
                  
                  return (
                    <Card key={docType} className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium">{labels[docType as keyof typeof labels]}</h3>
                          {document && (
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(document.status)}
                              <Badge className={`${getStatusColor(document.status)} text-white text-xs`}>
                                {document.status}
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        {document ? (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-400">
                              Enviado em: {new Date(document.uploadedAt).toLocaleDateString()}
                            </p>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" className="border-gray-600">
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </Button>
                              <Button size="sm" variant="outline" className="border-gray-600">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <label className="block">
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleDocumentUpload(docType, file);
                              }}
                              className="hidden"
                              disabled={uploading}
                            />
                            <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-gray-500 transition-colors">
                              {uploading ? (
                                <RefreshCw className="h-8 w-8 animate-spin text-yellow-400 mx-auto mb-2" />
                              ) : (
                                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              )}
                              <p className="text-sm text-gray-400">
                                {uploading ? 'Enviando...' : 'Clique para enviar ou arraste o arquivo'}
                              </p>
                            </div>
                          </label>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-yellow-400" />
                <span>Preferências de Notificação</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {Object.entries(profile.notifications).map(([key, enabled]) => {
                  const labels = {
                    email: 'Notificações por Email',
                    sms: 'Notificações por SMS',
                    push: 'Notificações Push',
                    trading: 'Alertas de Trading',
                    security: 'Alertas de Segurança',
                    marketing: 'Ofertas e Promoções'
                  };
                  
                  return (
                    <div key={key} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                      <div>
                        <p className="font-medium">{labels[key as keyof typeof labels]}</p>
                        <p className="text-sm text-gray-400">
                          {key === 'security' && 'Recomendado manter ativado'}
                          {key === 'trading' && 'Receba alertas sobre suas operações'}
                          {key === 'email' && 'Notificações importantes por email'}
                          {key === 'sms' && 'Alertas críticos por SMS'}
                          {key === 'push' && 'Notificações no navegador'}
                          {key === 'marketing' && 'Ofertas e novidades da plataforma'}
                        </p>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => {
                          setProfileForm(prev => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications!,
                              [key]: checked
                            }
                          }));
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              
              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="bg-yellow-600 hover:bg-yellow-700 text-black"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Preferências
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="bg-black/80 backdrop-blur-sm border-blue-400/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-yellow-400" />
                <span>Preferências Gerais</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <Select 
                    value={profileForm.language || ''} 
                    onValueChange={(value) => setProfileForm(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600">
                      <SelectValue placeholder="Selecione o idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                      <SelectItem value="fr-FR">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select 
                    value={profileForm.timezone || ''} 
                    onValueChange={(value) => setProfileForm(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600">
                      <SelectValue placeholder="Selecione o fuso horário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="currency">Moeda Principal</Label>
                  <Select 
                    value={profileForm.currency || ''} 
                    onValueChange={(value) => setProfileForm(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600">
                      <SelectValue placeholder="Selecione a moeda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                      <SelectItem value="BRL">BRL - Real Brasileiro</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="BTC">BTC - Bitcoin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="bg-yellow-600 hover:bg-yellow-700 text-black"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Preferências
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;
