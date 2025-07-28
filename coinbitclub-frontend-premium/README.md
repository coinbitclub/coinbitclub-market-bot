# 🚀 CoinBitClub Market Bot - Frontend Premium

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/coinbitclub/coinbitclub-market-bot)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.30-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC.svg)](https://tailwindcss.com/)

## 📋 Índice

- [🎯 Visão Geral](#-visão-geral)
- [🏗️ Arquitetura](#️-arquitetura)
- [⚡ Quick Start](#-quick-start)
- [📁 Estrutura do Projeto](#-estrutura-do-projeto)
- [🛠️ Tecnologias](#️-tecnologias)
- [🔧 Scripts Disponíveis](#-scripts-disponíveis)
- [📊 Funcionalidades](#-funcionalidades)
- [🌐 Deploy](#-deploy)
- [📚 Documentação](#-documentação)
- [🧪 Testes](#-testes)
- [🤝 Contribuição](#-contribuição)

## 🎯 Visão Geral

O **CoinBitClub Market Bot Frontend Premium** é uma aplicação Next.js moderna e completa que fornece uma interface elegante para o sistema de trading automatizado CoinBitClub. Desenvolvido com as melhores práticas de React/Next.js, oferece uma experiência de usuário excepcional com responsividade total e performance otimizada.

### ✨ Principais Características

- 🎨 **Interface Moderna**: Design responsivo com Tailwind CSS
- ⚡ **Performance Otimizada**: SSR/SSG com Next.js 14
- 🔐 **Autenticação Segura**: JWT + refresh tokens
- 📱 **Mobile-First**: Totalmente responsivo
- 🌙 **Tema Escuro**: Interface elegante e profissional
- 📊 **Dashboards Interativos**: Visualização de dados em tempo real
- 🚀 **Deploy Automático**: Integração com Vercel e Railway

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND NEXT.JS                        │
├─────────────────────────────────────────────────────────────┤
│  Pages Router + App Router Hybrid                          │
│  ├── 🏠 Landing Page                                        │
│  ├── 🔐 Autenticação (Login/Register/Reset)                 │
│  ├── 📊 Dashboard Usuário                                   │
│  ├── 👥 Dashboard Afiliado                                  │
│  ├── ⚙️  Dashboard Admin                                     │
│  └── 📱 Mobile Components                                   │
├─────────────────────────────────────────────────────────────┤
│                     API LAYER                              │
│  ├── 🔌 Axios Interceptors                                  │
│  ├── 🔄 Auto Retry & Error Handling                         │
│  ├── 🍪 Token Management                                    │
│  └── 📡 Real-time WebSocket                                │
├─────────────────────────────────────────────────────────────┤
│                  BACKEND INTEGRATION                       │
│  └── 🚀 Railway Backend API (PostgreSQL)                   │
└─────────────────────────────────────────────────────────────┘
```

## ⚡ Quick Start

### 📋 Pré-requisitos

- **Node.js** >= 18.0.0
- **Yarn** >= 1.22.0 (recomendado) ou npm
- **Git**

### 🚀 Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/coinbitclub/coinbitclub-market-bot.git
cd coinbitclub-market-bot/coinbitclub-frontend-premium

# 2. Instale as dependências
yarn install
# ou
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local

# 4. Execute o projeto em desenvolvimento
yarn dev
# ou
npm run dev
```

### 🌐 Acessar a aplicação

- **Frontend**: [http://localhost:3001](http://localhost:3001)
- **Backend API**: Configurado no .env.local

## 📁 Estrutura do Projeto

```
coinbitclub-frontend-premium/
├── 📁 pages/                          # Páginas Next.js
│   ├── index.tsx                      # 🏠 Landing Page
│   ├── auth/                          # 🔐 Autenticação
│   │   ├── login.tsx                  # Login
│   │   └── register.tsx               # Registro
│   ├── admin/                         # ⚙️ Admin Dashboard
│   │   ├── dashboard-executive.tsx    # Dashboard Executivo
│   │   ├── users-new.tsx              # Gestão de Usuários
│   │   ├── affiliates-new.tsx         # Gestão de Afiliados
│   │   ├── operations-new.tsx         # Operações
│   │   ├── accounting-new.tsx         # Contabilidade
│   │   ├── alerts-new.tsx             # Alertas
│   │   └── settings.tsx               # Configurações
│   ├── user/                          # 👤 Área do Usuário
│   │   └── dashboard.tsx              # Dashboard do Usuário
│   ├── affiliate/                     # 👥 Área do Afiliado
│   │   └── dashboard.tsx              # Dashboard do Afiliado
│   └── api/                           # 🔌 API Routes
├── 📁 components/                     # Componentes Reutilizáveis
│   └── mobile/                        # Componentes Mobile
│       └── MobileComponents.tsx       # Sistema Mobile Completo
├── 📁 src/                            # Código fonte
│   ├── components/                    # Componentes base
│   ├── hooks/                         # Custom Hooks
│   ├── utils/                         # Utilitários
│   └── types/                         # Tipos TypeScript
├── 📁 public/                         # Assets estáticos
├── 📁 styles/                         # Estilos CSS
├── 📁 documentation/                  # 📚 Documentação
│   ├── guides/                        # Guias de uso
│   ├── reports/                       # Relatórios
│   └── deployment/                    # Scripts de deploy
├── 📁 utilities/                      # 🛠️ Utilitários
│   ├── scripts/                       # Scripts auxiliares
│   └── tests/                         # Testes utilitários
├── package.json                       # Dependências
├── next.config.js                     # Configuração Next.js
├── tailwind.config.js                 # Configuração Tailwind
├── tsconfig.json                      # Configuração TypeScript
└── vercel.json                        # Configuração Vercel
```

## 🛠️ Tecnologias

### 🎨 Frontend Core
- **[Next.js 14.2.30](https://nextjs.org/)** - Framework React com SSR/SSG
- **[React 18](https://reactjs.org/)** - Biblioteca de interface
- **[TypeScript 5](https://www.typescriptlang.org/)** - Tipagem estática
- **[Tailwind CSS 3.3](https://tailwindcss.com/)** - Framework CSS utilitário

### 🔧 Bibliotecas e Tools
- **[Axios](https://axios-http.com/)** - Cliente HTTP
- **[React Hot Toast](https://react-hot-toast.com/)** - Notificações
- **[Heroicons](https://heroicons.com/)** - Ícones
- **[React Icons](https://react-icons.github.io/react-icons/)** - Biblioteca de ícones
- **[Socket.io](https://socket.io/)** - Real-time communication
- **[Stripe](https://stripe.com/)** - Processamento de pagamentos

### 🧪 Desenvolvimento e Qualidade
- **[ESLint](https://eslint.org/)** - Linting de código
- **[Prettier](https://prettier.io/)** - Formatação de código
- **[Jest](https://jestjs.io/)** - Testes unitários
- **[Playwright](https://playwright.dev/)** - Testes E2E

### ☁️ Deploy e Infraestrutura
- **[Vercel](https://vercel.com/)** - Deploy frontend
- **[Railway](https://railway.app/)** - Backend e banco de dados
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados

## 🔧 Scripts Disponíveis

### 🏃‍♂️ Desenvolvimento
```bash
yarn dev          # Servidor de desenvolvimento (porta 3001)
yarn build        # Build para produção
yarn start        # Servidor de produção
yarn type-check   # Verificação de tipos TypeScript
```

### 🧹 Qualidade de Código
```bash
yarn lint         # Verificação ESLint
yarn lint:fix     # Correção automática ESLint
yarn format       # Formatação com Prettier
yarn format:check # Verificação de formatação
yarn fix-all      # Lint + format automático
```

### 🧪 Testes
```bash
yarn test         # Todos os testes
yarn test:unit    # Testes unitários (Jest)
yarn test:e2e     # Testes E2E (Playwright)
yarn test:all     # Suite completa de testes
```

### 🚀 Deploy
```bash
yarn deploy         # Deploy Vercel
yarn deploy-safe    # Deploy com verificações
yarn prepare-deploy # Preparação para deploy
```

### 🔧 Utilitários
```bash
yarn diagnose      # Diagnóstico do projeto
yarn fix           # Correção automática de problemas
yarn test-suite    # Suite de testes completa
```

## 📊 Funcionalidades

### 🔐 Sistema de Autenticação
- ✅ Login com email/senha
- ✅ Registro de novos usuários
- ✅ Reset de senha por email
- ✅ Autenticação JWT com refresh tokens
- ✅ Proteção de rotas automática
- ✅ Gerenciamento de sessão

### 👤 Dashboard do Usuário
- ✅ Visão geral da conta
- ✅ Histórico de operações
- ✅ Performance e métricas
- ✅ Configurações de perfil
- ✅ Gestão de assinatura
- ✅ Notificações em tempo real

### 👥 Sistema de Afiliados
- ✅ Dashboard de afiliado
- ✅ Códigos de referência
- ✅ Tracking de comissões
- ✅ Histórico de pagamentos
- ✅ Estatísticas detalhadas
- ✅ Links personalizados

### ⚙️ Painel Administrativo
- ✅ **Dashboard Executivo** - Métricas e KPIs
- ✅ **Gestão de Usuários** - CRUD completo
- ✅ **Gestão de Afiliados** - Comissões e pagamentos
- ✅ **Operações** - Monitoramento de trades
- ✅ **Contabilidade** - Relatórios financeiros
- ✅ **Alertas** - Sistema de notificações
- ✅ **Configurações** - Parâmetros do sistema

### 📱 Mobile-First Design
- ✅ **Responsividade Completa** - Todos os dispositivos
- ✅ **Componentes Mobile** - Otimizados para touch
- ✅ **Performance Mobile** - Carregamento otimizado
- ✅ **UX Mobile** - Navegação intuitiva

### 🎨 Interface e UX
- ✅ **Tema Escuro** - Design profissional
- ✅ **Animações Suaves** - Transições elegantes
- ✅ **Loading States** - Feedback visual
- ✅ **Error Handling** - Tratamento de erros
- ✅ **Toast Notifications** - Feedback ao usuário

## 🌐 Deploy

### 🚀 Deploy Automático (Vercel)

O projeto está configurado para deploy automático no Vercel:

```bash
# Deploy direto
yarn deploy

# Deploy com verificações de segurança
yarn deploy-safe
```

### ⚙️ Variáveis de Ambiente

```bash
# .env.local (desenvolvimento)
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_ENVIRONMENT=development

# .env.production (produção)
NEXT_PUBLIC_API_URL=https://coinbitclub-market-bot.up.railway.app
NEXT_PUBLIC_ENVIRONMENT=production
```

### 🔗 URLs de Deploy

- **Frontend (Vercel)**: https://coinbitclub-market-6ty5yo6vc-coinbitclubs-projects.vercel.app
- **Backend (Railway)**: https://coinbitclub-market-bot.up.railway.app

## 📚 Documentação

### 📖 Documentação Disponível

- **[Guias de Implementação](./documentation/guides/)** - Como implementar funcionalidades
- **[Relatórios de Deploy](./documentation/reports/)** - Status e logs de deploy
- **[Scripts de Deploy](./documentation/deployment/)** - Automação de deploy
- **[Arquitetura](./documentation/guides/PROJETO-COMPLETO.md)** - Visão geral da arquitetura
- **[API Integration](./documentation/guides/INTEGRACAO-APIS-COMPLETA.md)** - Integração com backend

### 🔧 Scripts Utilitários

```bash
# Verificar estrutura do projeto
node utilities/scripts/analyze-operations.js

# Testar conexão com API
node utilities/tests/test-complete-api.js

# Verificar banco de dados
node utilities/tests/check-database-structure.js
```

## 🧪 Testes

### 🔬 Tipos de Testes

- **Unitários**: Componentes e funções isoladas
- **Integração**: Fluxos completos de usuário
- **E2E**: Testes ponta a ponta com Playwright
- **API**: Testes de integração com backend

### 🎯 Coverage e Qualidade

```bash
# Executar todos os testes
yarn test:all

# Testes específicos
yarn test:unit        # Jest
yarn test:e2e         # Playwright
yarn test:integration # Integração com API
```

## 🤝 Contribuição

### 📋 Como Contribuir

1. **Fork** o repositório
2. **Clone** seu fork
3. **Crie** uma branch: `git checkout -b feature/nova-funcionalidade`
4. **Desenvolva** seguindo os padrões do projeto
5. **Teste** suas alterações: `yarn test:all`
6. **Commit** com mensagens descritivas
7. **Push** para sua branch
8. **Abra** um Pull Request

### 📏 Padrões de Código

- **ESLint + Prettier** para formatação
- **TypeScript** obrigatório
- **Tailwind CSS** para estilos
- **Commits semânticos** (feat, fix, docs, etc.)
- **Testes** para novas funcionalidades

### 🔍 Code Review

Todos os PRs passam por:
- ✅ Verificação automática de CI
- ✅ Review de código
- ✅ Testes automáticos
- ✅ Build de produção

## 🎉 Conclusão

O **CoinBitClub Market Bot Frontend Premium** representa o estado da arte em aplicações Next.js para trading automatizado. Com uma arquitetura sólida, código limpo e documentação completa, oferece uma base robusta para o crescimento e evolução do sistema.

### 📈 Próximos Passos

- 🚀 Implementação de novos dashboards
- 📊 Melhoria na visualização de dados
- 🔔 Sistema de notificações push
- 📱 App mobile nativo
- 🤖 Integração com mais AIs

---

**📅 Última Atualização**: 28 de Julho de 2025  
**👨‍💻 Desenvolvido por**: CoinBitClub Team  
**📧 Suporte**: support@coinbitclub.com  
**🌐 Website**: https://coinbitclub.com

**⭐ Se este projeto foi útil, considere dar uma estrela no GitHub!**
