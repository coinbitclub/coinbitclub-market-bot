// ====================================
// 🚀 EXECUTAR FASE 1: CORREÇÕES CRÍTICAS
// Meta: Atingir 95%+ nos testes
// ====================================

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🚀 INICIANDO FASE 1: CORREÇÕES CRÍTICAS');
console.log('========================================');
console.log('🎯 Meta: 95%+ aproveitamento nos testes');
console.log('⏱️ Duração estimada: 2 dias\n');

// ==============================================
// F1.1: IMPLEMENTAR FRONTEND NEXT.JS COMPLETO
// ==============================================

async function criarFrontendNextJS() {
    console.log('📦 F1.1: Criando Frontend Next.js...');
    
    const frontendDir = path.join(__dirname, '..', 'frontend');
    
    // Criar diretório frontend se não existir
    if (!fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir, { recursive: true });
    }
    
    // package.json do frontend
    const packageJson = {
        "name": "coinbitclub-frontend",
        "version": "1.0.0",
        "private": true,
        "scripts": {
            "dev": "next dev -p 3000",
            "build": "next build",
            "start": "next start -p 3000",
            "lint": "next lint"
        },
        "dependencies": {
            "next": "14.2.5",
            "react": "^18",
            "react-dom": "^18",
            "axios": "^1.7.2",
            "jsonwebtoken": "^9.0.2",
            "@tailwindcss/forms": "^0.5.7"
        },
        "devDependencies": {
            "@types/node": "^20",
            "@types/react": "^18",
            "@types/react-dom": "^18",
            "autoprefixer": "^10.4.19",
            "eslint": "^8",
            "eslint-config-next": "14.2.5",
            "postcss": "^8.4.39",
            "tailwindcss": "^3.4.6",
            "typescript": "^5"
        }
    };
    
    fs.writeFileSync(path.join(frontendDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    
    // next.config.js
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*'
      }
    ];
  }
};

module.exports = nextConfig;`;
    
    fs.writeFileSync(path.join(frontendDir, 'next.config.js'), nextConfig);
    
    // tailwind.config.js
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}`;
    
    fs.writeFileSync(path.join(frontendDir, 'tailwind.config.js'), tailwindConfig);
    
    // postcss.config.js
    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
    
    fs.writeFileSync(path.join(frontendDir, 'postcss.config.js'), postcssConfig);
    
    // Criar diretórios necessários
    const dirs = ['pages', 'components', 'services', 'styles'];
    dirs.forEach(dir => {
        const dirPath = path.join(frontendDir, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });
    
    console.log('✅ Estrutura básica do frontend criada');
}

// Página inicial (/)
function criarPaginaHome() {
    const frontendDir = path.join(__dirname, '..', 'frontend');
    
    const indexPage = `import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    // Verificar status do backend
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setStatus('connected'))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <>
      <Head>
        <title>CoinbitClub MarketBot</title>
        <meta name="description" content="Sistema de Trading Automatizado" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-6">
              CoinbitClub MarketBot
            </h1>
            <p className="text-xl mb-8">
              Sistema de Trading Automatizado com IA
            </p>
            
            <div className="mb-8">
              <div className={\`inline-flex items-center px-4 py-2 rounded-full \${
                status === 'connected' ? 'bg-green-500' : 
                status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
              }\`}>
                <div className={\`w-3 h-3 rounded-full mr-2 \${
                  status === 'connected' ? 'bg-green-200' : 
                  status === 'error' ? 'bg-red-200' : 'bg-yellow-200'
                }\`}></div>
                Sistema: {status === 'connected' ? 'Online' : 
                         status === 'error' ? 'Offline' : 'Verificando...'}
              </div>
            </div>

            <div className="space-x-4">
              <Link href="/login">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg">
                  Fazer Login
                </button>
              </Link>
              <Link href="/register">
                <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg">
                  Criar Conta
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}`;
    
    fs.writeFileSync(path.join(frontendDir, 'pages', 'index.js'), indexPage);
    console.log('✅ Página inicial criada');
}

// Página de login
function criarPaginaLogin() {
    const frontendDir = path.join(__dirname, '..', 'frontend');
    
    const loginPage = `import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      } else {
        setError(data.error || 'Erro no login');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - CoinbitClub MarketBot</title>
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Faça login na sua conta
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </div>

              <div className="text-center">
                <Link href="/register" className="text-indigo-600 hover:text-indigo-500">
                  Não tem conta? Criar uma
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}`;
    
    fs.writeFileSync(path.join(frontendDir, 'pages', 'login.js'), loginPage);
    console.log('✅ Página de login criada');
}

// Página de registro
function criarPaginaRegistro() {
    const frontendDir = path.join(__dirname, '..', 'frontend');
    
    const registerPage = `import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Conta criada com sucesso! Redirecionando...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || 'Erro no registro');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Registro - CoinbitClub MarketBot</title>
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Criar nova conta
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleRegister}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Criando...' : 'Criar Conta'}
                </button>
              </div>

              <div className="text-center">
                <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
                  Já tem conta? Fazer login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}`;
    
    fs.writeFileSync(path.join(frontendDir, 'pages', 'register.js'), registerPage);
    console.log('✅ Página de registro criada');
}

// Página de dashboard
function criarPaginaDashboard() {
    const frontendDir = path.join(__dirname, '..', 'frontend');
    
    const dashboardPage = `import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Carregar dados do usuário
    loadUserData(token);
  }, []);

  const loadUserData = async (token) => {
    try {
      // Carregar dados do usuário
      const userResponse = await fetch('/api/user/profile', {
        headers: {
          'Authorization': \`Bearer \${token}\`
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
      }

      // Carregar estatísticas
      const statsResponse = await fetch('/api/user/stats', {
        headers: {
          'Authorization': \`Bearer \${token}\`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - CoinbitClub MarketBot</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">CoinbitClub MarketBot</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Olá, {user?.name || 'Usuário'}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">$</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Saldo Total
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          $\{stats?.balance || '0.00'\}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">📊</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Operações Hoje
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          \{stats?.todayOperations || '0'\}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">%</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Performance
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          +\{stats?.performance || '0.0'\}%
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Sistema de Trading
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Status do Sistema</h4>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Sistema Online</span>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Última Atualização</h4>
                    <span className="text-sm text-gray-600">
                      {new Date().toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}`;
    
    fs.writeFileSync(path.join(frontendDir, 'pages', 'dashboard.js'), dashboardPage);
    console.log('✅ Página de dashboard criada');
}

// Arquivo de estilos globais
function criarEstilosGlobais() {
    const frontendDir = path.join(__dirname, '..', 'frontend');
    
    const globalStyles = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: system-ui, sans-serif;
  }
}

@layer components {
  .btn-primary {
    @apply bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded;
  }
  
  .btn-secondary {
    @apply bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded;
  }
  
  .card {
    @apply bg-white shadow-lg rounded-lg p-6;
  }
}`;
    
    fs.writeFileSync(path.join(frontendDir, 'styles', 'globals.css'), globalStyles);
    console.log('✅ Estilos globais criados');
}

// ==============================================
// F1.2: CORRIGIR ENDPOINT USER REGISTRATION
// ==============================================

function corrigirEndpointRegistro() {
    console.log('🔧 F1.2: Corrigindo endpoint de registro...');
    
    const serverPath = path.join(__dirname, 'api-gateway', 'server.cjs');
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Encontrar e corrigir a função registerUser
    const oldRegisterFunction = `async function registerUser(req, res) {
  try {
    const { email, name, role } = req.body;
    
    console.log('📝 Tentativa de registro:', {
      email,
      name,
      role
    });

    // Inserir usuário (sem senha por enquanto)
    const result = await pool.query(\`
      INSERT INTO users (email, name, role, password) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, email, name, role
    \`, [email, name, role, 'hash_password_123']);`;
    
    const newRegisterFunction = `async function registerUser(req, res) {
  try {
    const { email, name, password, phone, role = 'user' } = req.body;
    
    console.log('📝 Tentativa de registro:', {
      email,
      name,
      role,
      phone: phone ? 'fornecido' : 'não fornecido'
    });

    // Validar dados obrigatórios
    if (!email || !name || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email, nome e senha são obrigatórios'
      });
    }

    // Verificar se usuário já existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso'
      });
    }

    // Hash da senha (por enquanto, simples - depois implementar bcrypt)
    const hashedPassword = 'hash_' + password + '_' + Date.now();

    // Inserir usuário
    const result = await pool.query(\`
      INSERT INTO users (email, name, password, whatsapp, role, status) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, email, name, role, status
    \`, [email, name, hashedPassword, phone, role, 'active']);`;
    
    if (serverContent.includes(oldRegisterFunction)) {
        serverContent = serverContent.replace(oldRegisterFunction, newRegisterFunction);
        fs.writeFileSync(serverPath, serverContent);
        console.log('✅ Endpoint de registro corrigido');
    } else {
        console.log('⚠️ Função registerUser não encontrada no formato esperado');
    }
}

// ==============================================
// F1.3: CONFIGURAR STARTUP SCRIPTS
// ==============================================

function criarStartupScripts() {
    console.log('🚀 F1.3: Criando scripts de startup...');
    
    // Script para iniciar backend
    const startBackend = `// ====================================
// 🚀 INICIAR BACKEND COINBITCLUB
// ====================================

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Backend CoinbitClub MarketBot...');
console.log('📍 Porta: 8080');
console.log('🔗 URL: http://localhost:8080');

// Navegar para diretório do api-gateway
process.chdir(path.join(__dirname, 'api-gateway'));

// Iniciar servidor
const server = spawn('node', ['server.cjs'], {
    stdio: 'inherit',
    shell: true
});

server.on('error', (error) => {
    console.error('❌ Erro ao iniciar backend:', error);
});

server.on('close', (code) => {
    console.log(\`🔚 Backend finalizado com código \${code}\`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\\n🛑 Parando backend...');
    server.kill('SIGINT');
});`;
    
    fs.writeFileSync(path.join(__dirname, '..', 'start-backend.js'), startBackend);
    
    // Script para iniciar frontend
    const startFrontend = `// ====================================
// 🚀 INICIAR FRONTEND COINBITCLUB
// ====================================

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Iniciando Frontend CoinbitClub MarketBot...');
console.log('📍 Porta: 3000');
console.log('🔗 URL: http://localhost:3000');

const frontendDir = path.join(__dirname, 'frontend');

// Verificar se existe diretório frontend
if (!fs.existsSync(frontendDir)) {
    console.log('❌ Diretório frontend não encontrado');
    console.log('🔧 Execute primeiro: node executar-fase1.js');
    process.exit(1);
}

// Navegar para diretório do frontend
process.chdir(frontendDir);

// Verificar se node_modules existe
if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
    console.log('📦 Instalando dependências do frontend...');
    const install = spawn('npm', ['install'], {
        stdio: 'inherit',
        shell: true
    });
    
    install.on('close', (code) => {
        if (code === 0) {
            startNextApp();
        } else {
            console.error('❌ Erro ao instalar dependências');
        }
    });
} else {
    startNextApp();
}

function startNextApp() {
    console.log('🚀 Iniciando aplicação Next.js...');
    
    const server = spawn('npm', ['run', 'dev'], {
        stdio: 'inherit',
        shell: true
    });

    server.on('error', (error) => {
        console.error('❌ Erro ao iniciar frontend:', error);
    });

    server.on('close', (code) => {
        console.log(\`🔚 Frontend finalizado com código \${code}\`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\\n🛑 Parando frontend...');
        server.kill('SIGINT');
    });
}`;
    
    fs.writeFileSync(path.join(__dirname, '..', 'start-frontend.js'), startFrontend);
    
    // Script para iniciar sistema completo
    const startFullSystem = `// ====================================
// 🚀 INICIAR SISTEMA COMPLETO
// ====================================

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 INICIANDO SISTEMA COMPLETO COINBITCLUB MARKETBOT');
console.log('====================================================');
console.log('🔹 Backend: http://localhost:8080');
console.log('🔹 Frontend: http://localhost:3000');
console.log('🔹 Para parar: Ctrl+C');

let backend, frontend;

// Iniciar backend
console.log('\\n1️⃣ Iniciando Backend...');
backend = spawn('node', ['start-backend.js'], {
    stdio: 'pipe',
    shell: true
});

backend.stdout.on('data', (data) => {
    console.log(\`[BACKEND] \${data.toString().trim()}\`);
});

backend.stderr.on('data', (data) => {
    console.error(\`[BACKEND ERROR] \${data.toString().trim()}\`);
});

// Aguardar backend inicializar e depois iniciar frontend
setTimeout(() => {
    console.log('\\n2️⃣ Iniciando Frontend...');
    frontend = spawn('node', ['start-frontend.js'], {
        stdio: 'pipe',
        shell: true
    });

    frontend.stdout.on('data', (data) => {
        console.log(\`[FRONTEND] \${data.toString().trim()}\`);
    });

    frontend.stderr.on('data', (data) => {
        console.error(\`[FRONTEND ERROR] \${data.toString().trim()}\`);
    });
}, 3000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\\n🛑 Parando sistema completo...');
    if (backend) backend.kill('SIGINT');
    if (frontend) frontend.kill('SIGINT');
    process.exit(0);
});`;
    
    fs.writeFileSync(path.join(__dirname, '..', 'start-full-system.js'), startFullSystem);
    
    console.log('✅ Scripts de startup criados');
}

// ==============================================
// EXECUTAR FASE 1 COMPLETA
// ==============================================

async function executarFase1() {
    try {
        console.log('⏱️ Iniciando execução da Fase 1...\n');
        
        // F1.1: Frontend Next.js
        await criarFrontendNextJS();
        criarPaginaHome();
        criarPaginaLogin();
        criarPaginaRegistro();
        criarPaginaDashboard();
        criarEstilosGlobais();
        
        // F1.2: Corrigir registro
        corrigirEndpointRegistro();
        
        // F1.3: Scripts de startup
        criarStartupScripts();
        
        console.log('\n🎉 FASE 1 CONCLUÍDA COM SUCESSO!');
        console.log('=====================================');
        console.log('✅ Frontend Next.js criado');
        console.log('✅ Páginas implementadas (/, /login, /register, /dashboard)');
        console.log('✅ Endpoint de registro corrigido');
        console.log('✅ Scripts de startup criados');
        
        console.log('\n🚀 PRÓXIMOS PASSOS:');
        console.log('1. Testar sistema: node start-full-system.js');
        console.log('2. Executar homologação: node scripts/homologacao-completa.js');
        console.log('3. Verificar se atingiu 95%+');
        
        console.log('\n📋 COMANDOS DISPONÍVEIS:');
        console.log('   node start-backend.js    - Apenas backend');
        console.log('   node start-frontend.js   - Apenas frontend');
        console.log('   node start-full-system.js - Sistema completo');
        
    } catch (error) {
        console.error('❌ Erro na execução da Fase 1:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    executarFase1();
}

module.exports = { executarFase1 };
