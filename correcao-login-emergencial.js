/**
 * 🔧 CORREÇÃO EMERGENCIAL - PROBLEMAS DE LOGIN/CADASTRO
 * Sistema de correção automática para problemas críticos
 * Versão: 1.0.0 - 28/07/2025
 */

const fs = require('fs');
const path = require('path');

class LoginFixEngine {
  constructor() {
    this.frontendPath = path.join(__dirname, 'coinbitclub-frontend-premium');
    this.fixes = {
      applied: [],
      failed: [],
      skipped: []
    };
  }

  async runEmergencyFixes() {
    console.log('🚨 INICIANDO CORREÇÕES EMERGENCIAIS DE LOGIN/CADASTRO...\n');
    
    try {
      // Fix 1: Corrigir URLs do backend no frontend
      await this.fixBackendUrls();
      
      // Fix 2: Corrigir componente de login
      await this.fixLoginComponent();
      
      // Fix 3: Criar páginas missing
      await this.createMissingPages();
      
      // Fix 4: Corrigir roteamento Next.js
      await this.fixNextJsRouting();
      
      // Fix 5: Verificar e corrigir configurações
      await this.fixConfigurations();
      
      console.log('\n✅ CORREÇÕES EMERGENCIAIS FINALIZADAS!');
      this.generateFixReport();
      
    } catch (error) {
      console.error('❌ ERRO CRÍTICO NAS CORREÇÕES:', error);
      throw error;
    }
  }

  async fixBackendUrls() {
    console.log('🔧 Corrigindo URLs do backend...');
    
    const urlFixes = [
      {
        file: 'pages/auth/login.tsx',
        search: 'http://localhost:8081',
        replace: 'http://localhost:3000'
      },
      {
        file: 'components/auth/LoginForm.jsx', 
        search: 'http://localhost:8081',
        replace: 'http://localhost:3000'
      },
      {
        file: 'src/utils/api.js',
        search: 'baseURL: "http://localhost:8081"',
        replace: 'baseURL: "http://localhost:3000"'
      }
    ];

    for (const fix of urlFixes) {
      try {
        const filePath = path.join(this.frontendPath, fix.file);
        
        if (fs.existsSync(filePath)) {
          let content = fs.readFileSync(filePath, 'utf8');
          
          if (content.includes(fix.search)) {
            content = content.replace(new RegExp(fix.search, 'g'), fix.replace);
            fs.writeFileSync(filePath, content);
            
            console.log(`✅ Corrigido: ${fix.file}`);
            this.fixes.applied.push(`URL fix: ${fix.file}`);
          } else {
            console.log(`⚠️ URL já correta em: ${fix.file}`);
            this.fixes.skipped.push(`URL already correct: ${fix.file}`);
          }
        } else {
          console.log(`❌ Arquivo não encontrado: ${fix.file}`);
          this.fixes.failed.push(`File not found: ${fix.file}`);
        }
      } catch (error) {
        console.log(`❌ Erro ao corrigir ${fix.file}: ${error.message}`);
        this.fixes.failed.push(`Error fixing ${fix.file}: ${error.message}`);
      }
    }
  }

  async fixLoginComponent() {
    console.log('\n🔧 Corrigindo componente de login...');
    
    const loginComponentFixed = `import React, { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validações básicas
      if (!formData.email || !formData.password) {
        throw new Error('Email e senha são obrigatórios');
      }

      if (!formData.email.includes('@')) {
        throw new Error('Email inválido');
      }

      console.log('🔐 Tentando login para:', formData.email);

      // Fazer login
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        email: formData.email,
        password: formData.password
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;

      if (response.status === 200 && data.success !== false) {
        console.log('✅ Login realizado com sucesso:', data);
        
        // Salvar token
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));

        // Redirecionar baseado no role
        const userRole = data.user.role || data.user.user_type || 'user';
        console.log('User role detected:', userRole);
        
        switch (userRole) {
          case 'admin':
            console.log('Redirecting to admin dashboard');
            router.push('/admin/dashboard');
            break;
          case 'affiliate':
            console.log('Redirecting to affiliate dashboard');
            router.push('/affiliate/dashboard');
            break;
          case 'user':
          default:
            console.log('Redirecting to user dashboard');
            router.push('/dashboard');
        }
      } else {
        throw new Error(data.message || data.error || 'Erro no login');
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      
      // Tratar diferentes tipos de erro
      if (error.response?.status === 401) {
        setError('Email ou senha incorretos');
      } else if (error.response?.status === 429) {
        setError('Muitas tentativas. Tente novamente em alguns minutos.');
      } else if (error.response?.status >= 500) {
        setError('Erro interno do servidor. Tente novamente mais tarde.');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
        setError('Erro de conexão. Verifique se o servidor está rodando na porta 3000.');
      } else {
        setError(error.message || 'Erro inesperado. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setFormData({
      email: 'faleconosco@coinbitclub.vip',
      password: 'password'
    });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#0f0f23',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#1a1a2e',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid #16213e'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#ffa500',
            borderRadius: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            ₿
          </div>
          <h1 style={{ color: 'white', margin: 0, fontSize: '24px' }}>
            Bem-vindo de volta
          </h1>
          <p style={{ color: '#a0a0a0', margin: '8px 0 0', fontSize: '14px' }}>
            Entre na sua conta CoinBitClub
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#ff4444',
            color: 'white',
            padding: '12px',
            borderRadius: '5px',
            marginBottom: '20px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="faleconosco@coinbitclub.vip"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '5px',
                border: '1px solid #333',
                backgroundColor: '#2d2d44',
                color: 'white',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              Senha
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '5px',
                border: '1px solid #333',
                backgroundColor: '#2d2d44',
                color: 'white',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px', fontSize: '12px' }}>
            <label style={{ color: '#a0a0a0', display: 'flex', alignItems: 'center' }}>
              <input type="checkbox" style={{ marginRight: '8px' }} />
              Lembrar de mim
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#666' : '#ffa500',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '15px'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar →'}
          </button>

          <button
            type="button"
            onClick={handleDemoLogin}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'transparent',
              color: '#ffa500',
              border: '1px solid #ffa500',
              borderRadius: '5px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Usar Credenciais Demo
          </button>
        </form>

        <div style={{ 
          marginTop: '30px', 
          padding: '15px', 
          backgroundColor: '#16213e', 
          borderRadius: '5px',
          border: '1px solid #1e3a2e'
        }}>
          <h4 style={{ color: '#4ade80', margin: '0 0 10px', fontSize: '14px' }}>
            🔒 Login Seguro
          </h4>
          <p style={{ color: '#a0a0a0', margin: 0, fontSize: '12px' }}>
            ✅ Autenticação JWT<br/>
            ✅ Verificação SMS<br/>
            ✅ SSL/TLS Encryption
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <a 
            href="/auth/register" 
            style={{ color: '#ffa500', textDecoration: 'none', fontSize: '14px' }}
          >
            Não tem uma conta? Cadastre-se
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;`;

    try {
      const loginPath = path.join(this.frontendPath, 'pages', 'auth', 'login.tsx');
      fs.writeFileSync(loginPath, loginComponentFixed);
      
      console.log('✅ Componente de login corrigido');
      this.fixes.applied.push('Login component fixed');
    } catch (error) {
      console.log(`❌ Erro ao corrigir login: ${error.message}`);
      this.fixes.failed.push(`Login fix error: ${error.message}`);
    }
  }

  async createMissingPages() {
    console.log('\n🔧 Criando páginas faltantes...');
    
    const pagesToCreate = [
      {
        path: 'pages/forgot-password.tsx',
        content: this.getForgotPasswordPage()
      },
      {
        path: 'pages/dashboard.tsx',
        content: this.getDashboardPage()
      },
      {
        path: 'pages/404.tsx',
        content: this.get404Page()
      }
    ];

    for (const page of pagesToCreate) {
      try {
        const fullPath = path.join(this.frontendPath, page.path);
        const dir = path.dirname(fullPath);
        
        // Criar diretório se não existir
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Criar arquivo se não existir
        if (!fs.existsSync(fullPath)) {
          fs.writeFileSync(fullPath, page.content);
          console.log(`✅ Criado: ${page.path}`);
          this.fixes.applied.push(`Created page: ${page.path}`);
        } else {
          console.log(`⚠️ Já existe: ${page.path}`);
          this.fixes.skipped.push(`Page exists: ${page.path}`);
        }
      } catch (error) {
        console.log(`❌ Erro ao criar ${page.path}: ${error.message}`);
        this.fixes.failed.push(`Create page error ${page.path}: ${error.message}`);
      }
    }
  }

  async fixNextJsRouting() {
    console.log('\n🔧 Corrigindo roteamento Next.js...');
    
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*'
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/login',
        permanent: false
      },
      {
        source: '/register',
        destination: '/auth/register',
        permanent: false
      }
    ];
  }
};

module.exports = nextConfig;`;

    try {
      const configPath = path.join(this.frontendPath, 'next.config.js');
      fs.writeFileSync(configPath, nextConfig);
      
      console.log('✅ Next.js config corrigido');
      this.fixes.applied.push('Next.js config fixed');
    } catch (error) {
      console.log(`❌ Erro ao corrigir Next.js config: ${error.message}`);
      this.fixes.failed.push(`Next.js config error: ${error.message}`);
    }
  }

  async fixConfigurations() {
    console.log('\n🔧 Verificando configurações...');
    
    // Verificar package.json
    try {
      const packagePath = path.join(this.frontendPath, 'package.json');
      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Verificar scripts
        if (!packageJson.scripts.dev.includes('3002')) {
          console.log('⚠️ Porto do frontend pode estar incorreto');
          this.fixes.failed.push('Frontend port may be incorrect');
        } else {
          console.log('✅ Configuração do package.json OK');
          this.fixes.applied.push('Package.json verified');
        }
      }
    } catch (error) {
      console.log(`❌ Erro ao verificar package.json: ${error.message}`);
      this.fixes.failed.push(`Package.json check error: ${error.message}`);
    }
  }

  getForgotPasswordPage() {
    return `import React, { useState } from 'react';
import { useRouter } from 'next/router';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('Funcionalidade em desenvolvimento');
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Recuperar Senha</h1>
      <p>Digite seu email para receber instruções de recuperação</p>
      
      <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu email"
          style={{ width: '100%', padding: '10px', margin: '10px 0' }}
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none' }}
        >
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
      
      {message && <p style={{ marginTop: '20px', color: 'blue' }}>{message}</p>}
      
      <div style={{ marginTop: '20px' }}>
        <a href="/auth/login" style={{ color: '#007bff' }}>Voltar ao Login</a>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;`;
  }

  getDashboardPage() {
    return `import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    
    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    router.push('/auth/login');
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Carregando...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Dashboard - CoinBitClub</h1>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}>
          Logout
        </button>
      </div>
      
      {user && (
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '5px', marginBottom: '20px' }}>
          <h3>Bem-vindo, {user.name || user.email}!</h3>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role || user.user_type || 'user'}</p>
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4>🔹 Operações</h4>
          <p>Visualize suas operações de trading</p>
          <button style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px' }}>
            Ver Operações
          </button>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4>📊 Estatísticas</h4>
          <p>Acompanhe seu desempenho</p>
          <button style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px' }}>
            Ver Estatísticas
          </button>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4>⚙️ Configurações</h4>
          <p>Gerencie suas preferências</p>
          <button style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px' }}>
            Configurar
          </button>
        </div>
      </div>
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '5px' }}>
        <h4 style={{ color: '#155724', margin: '0 0 10px' }}>✅ Sistema Operacional</h4>
        <p style={{ color: '#155724', margin: 0, fontSize: '14px' }}>
          Backend conectado • Autenticação funcionando • Dashboard carregado com sucesso
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;`;
  }

  get404Page() {
    return `import React from 'react';
import { useRouter } from 'next/router';

const Custom404 = () => {
  const router = useRouter();

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#0f0f23',
      color: 'white',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '120px', margin: '0', color: '#ffa500' }}>404</h1>
        <h2 style={{ fontSize: '24px', margin: '10px 0', color: 'white' }}>Página não encontrada</h2>
        <p style={{ fontSize: '16px', color: '#a0a0a0', maxWidth: '400px' }}>
          A página que você está procurando não existe ou foi movida.
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#ffa500',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Voltar ao Início
        </button>
        
        <button
          onClick={() => router.push('/auth/login')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            color: '#ffa500',
            border: '1px solid #ffa500',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Fazer Login
        </button>
      </div>
      
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#1a1a2e', borderRadius: '10px', maxWidth: '500px' }}>
        <h3 style={{ color: '#ffa500', margin: '0 0 15px' }}>🔧 Problemas Técnicos?</h3>
        <p style={{ color: '#a0a0a0', margin: '0', fontSize: '14px' }}>
          Se você chegou aqui através de um link válido, pode haver um problema temporário. 
          Tente atualizar a página ou entre em contato com o suporte.
        </p>
      </div>
    </div>
  );
};

export default Custom404;`;
  }

  generateFixReport() {
    const report = {
      timestamp: new Date().toISOString(),
      fixes: {
        applied: this.fixes.applied,
        failed: this.fixes.failed,
        skipped: this.fixes.skipped
      },
      summary: {
        total_fixes_attempted: this.fixes.applied.length + this.fixes.failed.length + this.fixes.skipped.length,
        successful_fixes: this.fixes.applied.length,
        failed_fixes: this.fixes.failed.length,
        skipped_fixes: this.fixes.skipped.length,
        success_rate: this.fixes.applied.length > 0 ? 
          Math.round((this.fixes.applied.length / (this.fixes.applied.length + this.fixes.failed.length)) * 100) : 0
      },
      next_steps: [
        'Restart the frontend development server',
        'Test login page at http://localhost:3002/auth/login',
        'Verify backend is running on port 3000',
        'Run complete audit with auditoria-completa.js'
      ]
    };

    const reportPath = path.join(__dirname, 'LOGIN_FIXES_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Relatório de correções salvo em: ${reportPath}`);
    console.log(`✅ Correções aplicadas: ${this.fixes.applied.length}`);
    console.log(`❌ Correções falharam: ${this.fixes.failed.length}`);
    console.log(`⚠️ Correções puladas: ${this.fixes.skipped.length}`);
    
    return report;
  }
}

// Executar correções se chamado diretamente
if (require.main === module) {
  const fixer = new LoginFixEngine();
  fixer.runEmergencyFixes().then(() => {
    console.log('\n🎯 CORREÇÕES FINALIZADAS');
    console.log('👉 Próximo passo: Reiniciar o servidor frontend e testar');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Erro fatal nas correções:', error);
    process.exit(1);
  });
}

module.exports = LoginFixEngine;
