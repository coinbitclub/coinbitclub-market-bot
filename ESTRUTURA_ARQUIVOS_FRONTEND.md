# 📁 ESTRUTURA DE ARQUIVOS FRONTEND
## CoinBitClub Market Bot v3.0.0 - Guia de Estrutura

**📅 Data:** 26 de Julho de 2025  
**🎯 Objetivo:** Estrutura completa do projeto Next.js  
**🔗 Backend:** 100% Funcional e Testado

---

## 📂 ESTRUTURA DE DIRETÓRIOS OBRIGATÓRIA

```
coinbitclub-frontend/
├── 📁 public/
│   ├── favicon.ico
│   ├── logo.png
│   └── images/
│       ├── logo-dark.png
│       ├── logo-light.png
│       └── hero-bg.jpg
│
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📁 common/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Loading.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   │
│   │   ├── 📁 auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   ├── ResetPasswordForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── 📁 dashboard/
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── StatsCards.jsx
│   │   │   ├── SignalsTable.jsx
│   │   │   ├── PerformanceChart.jsx
│   │   │   └── QuickActions.jsx
│   │   │
│   │   ├── 📁 signals/
│   │   │   ├── SignalsList.jsx
│   │   │   ├── SignalCard.jsx
│   │   │   ├── SignalFilters.jsx
│   │   │   └── SignalDetails.jsx
│   │   │
│   │   ├── 📁 subscription/
│   │   │   ├── PlansList.jsx
│   │   │   ├── PlanCard.jsx
│   │   │   ├── PaymentForm.jsx
│   │   │   └── SubscriptionStatus.jsx
│   │   │
│   │   ├── 📁 affiliate/
│   │   │   ├── AffiliateDashboard.jsx
│   │   │   ├── ReferralLink.jsx
│   │   │   ├── CommissionTable.jsx
│   │   │   └── AffiliateStats.jsx
│   │   │
│   │   └── 📁 ui/
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Card.jsx
│   │       ├── Modal.jsx
│   │       ├── Toast.jsx
│   │       └── Table.jsx
│   │
│   ├── 📁 pages/
│   │   ├── _app.js
│   │   ├── _document.js
│   │   ├── index.js
│   │   ├── login.js
│   │   ├── register.js
│   │   ├── dashboard.js
│   │   ├── signals.js
│   │   ├── profile.js
│   │   ├── subscription.js
│   │   ├── affiliate.js
│   │   └── 📁 api/
│   │       └── test.js
│   │
│   ├── 📁 hooks/
│   │   ├── useAuth.js
│   │   ├── useApi.js
│   │   ├── useSignals.js
│   │   ├── useSubscription.js
│   │   ├── useAffiliate.js
│   │   └── useNotifications.js
│   │
│   ├── 📁 contexts/
│   │   ├── AuthContext.js
│   │   ├── ThemeContext.js
│   │   └── NotificationContext.js
│   │
│   ├── 📁 utils/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   ├── formatting.js
│   │   └── validation.js
│   │
│   ├── 📁 styles/
│   │   ├── globals.css
│   │   ├── components.css
│   │   └── tailwind.css
│   │
│   └── 📁 lib/
│       ├── axios.js
│       ├── react-query.js
│       └── stripe.js
│
├── 📄 package.json
├── 📄 next.config.js
├── 📄 tailwind.config.js
├── 📄 .env.local
├── 📄 .env.example
├── 📄 .gitignore
└── 📄 README.md
```

---

## 📄 ARQUIVOS DE CONFIGURAÇÃO

### **package.json**
```json
{
  "name": "coinbitclub-frontend",
  "version": "3.0.0",
  "description": "CoinBitClub Market Bot Frontend",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "axios": "^1.6.0",
    "js-cookie": "^3.0.5",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.45.0",
    "react-hot-toast": "^2.4.1",
    "@headlessui/react": "^1.7.0",
    "@heroicons/react": "^2.0.0",
    "recharts": "^2.8.0",
    "date-fns": "^2.30.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "@types/js-cookie": "^3.0.0",
    "jest": "^29.0.0",
    "@testing-library/react": "^13.0.0"
  }
}
```

### **next.config.js**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['coinbitclub-market-bot-production.up.railway.app'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### **tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

### **.env.example**
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://coinbitclub-market-bot-production.up.railway.app
NEXT_PUBLIC_WS_URL=wss://coinbitclub-market-bot-production.up.railway.app

# Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS=G-XXXXXXXXXX
NEXT_PUBLIC_HOTJAR_ID=1234567

# Payment Gateways
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-...

# Social Auth (se implementado)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_FACEBOOK_APP_ID=...

# Feature Flags
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_DARK_MODE=true
NEXT_PUBLIC_ENABLE_AFFILIATE=true

# Environment
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_APP_VERSION=3.0.0
```

---

## 🎨 COMPONENTES BASE OBRIGATÓRIOS

### **src/components/common/Header.jsx**
```javascript
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/router';
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  BellIcon 
} from '@heroicons/react/24/outline';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Sinais', href: '/signals' },
    { name: 'Assinatura', href: '/subscription' },
    { name: 'Afiliados', href: '/affiliate' },
  ];

  return (
    <header className="bg-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <img
                className="h-8 w-auto"
                src="/logo.png"
                alt="CoinBitClub"
              />
              <span className="ml-2 text-xl font-bold text-gray-900">
                CoinBitClub
              </span>
            </div>
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    router.pathname === item.href
                      ? 'border-b-2 border-indigo-500 text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
          
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            <button
              type="button"
              className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500"
            >
              <BellIcon className="h-6 w-6" />
            </button>
            
            <div className="relative ml-3">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">
                  {user?.full_name || user?.email}
                </span>
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 pb-3 pt-2">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
              >
                {item.name}
              </a>
            ))}
            <button
              onClick={logout}
              className="block w-full text-left border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
```

### **src/components/ui/Button.jsx**
```javascript
import { forwardRef } from 'react';
import { clsx } from 'clsx';

const Button = forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  children, 
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    error: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500',
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };
  
  return (
    <button
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        loading && 'cursor-wait',
        className
      )}
      disabled={disabled || loading}
      ref={ref}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
```

### **src/utils/api.js**
```javascript
import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 segundos
});

// Interceptador de requisição
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log da requisição em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador de resposta
api.interceptors.response.use(
  (response) => {
    // Log da resposta em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`📥 ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    
    return response;
  },
  (error) => {
    const { response } = error;
    
    // Log do erro
    console.error('❌ API Error:', error);
    
    // Tratamento de erros específicos
    if (response?.status === 401) {
      // Token expirado ou inválido
      Cookies.remove('auth_token');
      toast.error('Sessão expirada. Faça login novamente.');
      
      // Redirecionar para login apenas se não estiver já na página de login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (response?.status === 403) {
      toast.error('Acesso negado.');
    } else if (response?.status === 404) {
      toast.error('Recurso não encontrado.');
    } else if (response?.status === 429) {
      toast.error('Muitas tentativas. Tente novamente em alguns minutos.');
    } else if (response?.status >= 500) {
      toast.error('Erro interno do servidor. Tente novamente mais tarde.');
    } else if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      toast.error('Erro de conexão. Verifique sua internet.');
    } else {
      // Erro genérico
      const message = response?.data?.message || 'Erro inesperado. Tente novamente.';
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// Funções de conveniência
export const apiService = {
  // Autenticação
  auth: {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (userData) => api.post('/auth/register', userData),
    resetPassword: (email) => api.post('/auth/reset-password', { email }),
    logout: () => {
      Cookies.remove('auth_token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
  },
  
  // Usuário
  user: {
    getProfile: () => api.get('/api/user/profile'),
    updateProfile: (data) => api.put('/api/user/profile', data),
    getStats: () => api.get('/api/user/stats'),
    getDashboard: () => api.get('/api/user/dashboard'),
  },
  
  // Sinais
  signals: {
    getAll: (params = {}) => api.get('/api/signals', { params }),
    getById: (id) => api.get(`/api/signals/${id}`),
    getStats: () => api.get('/api/signals/stats'),
  },
  
  // Assinaturas
  subscription: {
    getPlans: () => api.get('/api/plans'),
    getCurrent: () => api.get('/api/subscription'),
    create: (planId, paymentMethod) => api.post('/api/subscription/create', { plan_id: planId, payment_method: paymentMethod }),
    cancel: () => api.post('/api/subscription/cancel'),
  },
  
  // Afiliados
  affiliate: {
    register: () => api.post('/api/affiliate/register'),
    getDashboard: () => api.get('/api/affiliate/dashboard'),
    getCommissions: (params = {}) => api.get('/api/affiliate/commissions', { params }),
    getStats: () => api.get('/api/affiliate/stats'),
  },
  
  // Notificações
  notifications: {
    getAll: (params = {}) => api.get('/api/notifications', { params }),
    markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
    markAllAsRead: () => api.put('/api/notifications/read-all'),
  },
  
  // Sistema
  system: {
    healthCheck: () => api.get('/health'),
    getStatus: () => api.get('/api/status'),
    getMetrics: () => api.get('/api/metrics'),
  },
};

export default api;
```

---

## 🧪 TESTES OBRIGATÓRIOS

### **src/utils/testConnection.js**
```javascript
import { apiService } from './api';

export const runConnectionTests = async () => {
  console.log('🧪 Iniciando testes de conexão...');
  
  const tests = [
    {
      name: 'Health Check',
      test: () => apiService.system.healthCheck(),
    },
    {
      name: 'API Status',
      test: () => apiService.system.getStatus(),
    },
    {
      name: 'Planos Disponíveis',
      test: () => apiService.subscription.getPlans(),
    },
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`🔄 Testando: ${test.name}`);
      const result = await test.test();
      console.log(`✅ ${test.name}: OK`);
      results.push({ name: test.name, success: true, data: result.data });
    } catch (error) {
      console.error(`❌ ${test.name}: FALHOU`, error.message);
      results.push({ name: test.name, success: false, error: error.message });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`\n📊 Resultado: ${successCount}/${totalCount} testes passaram`);
  
  if (successCount === totalCount) {
    console.log('🎉 Todos os testes passaram! API está funcionando.');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique a configuração.');
  }
  
  return results;
};

// Executar testes automaticamente em desenvolvimento
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Esperar 2 segundos após o carregamento da página
  setTimeout(() => {
    runConnectionTests();
  }, 2000);
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### **✅ Configuração Inicial**
- [ ] Criar projeto Next.js com `npx create-next-app@latest`
- [ ] Instalar todas as dependências obrigatórias
- [ ] Configurar Tailwind CSS
- [ ] Configurar variáveis de ambiente
- [ ] Testar conexão com API backend

### **✅ Estrutura de Arquivos**
- [ ] Criar estrutura de diretórios completa
- [ ] Implementar componentes base (Header, Footer, Loading)
- [ ] Configurar roteamento Next.js
- [ ] Implementar sistema de layout

### **✅ Sistema de Autenticação**
- [ ] Configurar contexto de autenticação
- [ ] Implementar hook useAuth
- [ ] Criar formulários de login/registro
- [ ] Implementar proteção de rotas

### **✅ Páginas Principais**
- [ ] Dashboard principal
- [ ] Listagem de sinais
- [ ] Perfil do usuário
- [ ] Página de assinaturas
- [ ] Dashboard de afiliados

### **✅ Componentes UI**
- [ ] Sistema de design consistente
- [ ] Componentes reutilizáveis
- [ ] Responsividade mobile
- [ ] Estados de loading e erro

### **✅ Integração API**
- [ ] Configurar interceptadores Axios
- [ ] Implementar tratamento de erros
- [ ] Testar todos os endpoints
- [ ] Validar fluxos completos

---

**🎯 Esta estrutura garante um frontend robusto e bem organizado para integração com o backend 100% funcional!**

---

*Guia criado em 26/07/2025 - CoinBitClub Market Bot v3.0.0*
