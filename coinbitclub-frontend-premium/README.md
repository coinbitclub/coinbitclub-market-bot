# 🚀 CoinBitClub Frontend Premium

> **Plataforma avançada de trading de criptomoedas com interface moderna e funcionalidades premium**

![Next.js](https://img.shields.io/badge/Next.js-14.2.30-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3.0-blue?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

## 📋 Visão Geral

O CoinBitClub Frontend Premium é uma aplicação Next.js com TypeScript que oferece uma interface moderna e intuitiva para trading de criptomoedas, conectada ao backend Railway para operações em tempo real.

### 🌟 Funcionalidades Principais

- **Dashboard Interativo**: Visão completa das operações e saldo
- **Autenticação Avançada**: Login/registro com verificação SMS via Twilio
- **Trading em Tempo Real**: Interface para operações de compra/venda
- **Recuperação de Senha**: Sistema integrado com SMS
- **Painel Administrativo**: Gestão completa de usuários e operações
- **Painel de Afiliados**: Sistema de comissões e referrals
- **Interface Responsiva**: Design adaptado para mobile e desktop

### 🏗️ Arquitetura

```
Frontend (Next.js) ←→ Backend (Railway) ←→ Database (PostgreSQL)
      ↓                     ↓                    ↓
   Vercel Deploy      API Gateway         Cloud Database
```

## 🚀 Configuração e Desenvolvimento

### Pré-requisitos

- Node.js >= 18.0.0
- npm ou yarn
- Acesso ao backend Railway

### 📦 Instalação

```bash
# Clonar repositório
git clone https://github.com/coinbitclub/coinbitclub-market-bot.git
cd coinbitclub-frontend-premium

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
```

### ⚙️ Variáveis de Ambiente

```env
# Backend API
NEXT_PUBLIC_API_URL=https://coinbitclub-market-bot.up.railway.app
NEXT_PUBLIC_FRONTEND_URL=https://coinbitclub-frontend-premium.vercel.app

# Configurações de desenvolvimento
NODE_ENV=development
```

### 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento na porta 3001
npm run build           # Build para produção
npm run start           # Inicia servidor de produção
npm run lint            # Executa linter
npm run lint:fix        # Corrige problemas de linting

# Testes e qualidade
npm run test:unit       # Executa testes unitários
npm run test:e2e        # Executa testes end-to-end
npm run type-check      # Verifica tipos TypeScript

# Deploy e manutenção
npm run deploy          # Deploy completo para Vercel
npm run deploy-safe     # Deploy com verificações de segurança
```

## 🏃‍♂️ Execução

### Desenvolvimento Local

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Acessar aplicação
# http://localhost:3001
```

### Build de Produção

```bash
# Criar build otimizado
npm run build

# Iniciar servidor de produção
npm run start
```

## 📁 Estrutura do Projeto

```
coinbitclub-frontend-premium/
├── pages/                      # Páginas Next.js
│   ├── auth/                  # Autenticação
│   │   ├── login-integrated.tsx
│   │   ├── register.tsx
│   │   └── forgot-password-integrated.tsx
│   ├── admin/                 # Painel administrativo
│   │   ├── dashboard.tsx
│   │   ├── users.tsx
│   │   └── accounting.tsx
│   ├── user/                  # Área do usuário
│   │   ├── dashboard.tsx
│   │   ├── operations.tsx
│   │   └── settings.tsx
│   ├── affiliate/             # Sistema de afiliados
│   └── api/                   # API routes
├── src/
│   ├── components/            # Componentes reutilizáveis
│   │   ├── Layout/           # Layouts principais
│   │   ├── ui/               # Componentes de UI
│   │   └── auth/             # Componentes de autenticação
│   ├── lib/                  # Utilitários e configurações
│   │   ├── api.ts            # Cliente API
│   │   ├── auth.ts           # Contexto de autenticação
│   │   └── db.ts             # Configurações de banco
│   └── styles/               # Estilos globais
├── public/                   # Arquivos estáticos
├── middleware/              # Middleware customizado
├── config/                  # Configurações
└── documentation/           # Documentação adicional
```

## 🔐 Autenticação e Segurança

### Sistema de Autenticação

- **JWT Tokens**: Autenticação baseada em tokens
- **Verificação SMS**: Via Twilio para segurança adicional
- **Middleware de Proteção**: Rotas protegidas por role
- **Whitelist de IPs**: Controle de acesso por IP

### Roles de Usuário

```typescript
enum UserRole {
  USER = 'user',           // Usuário padrão
  ADMIN = 'admin',         // Administrador
  AFFILIATE = 'affiliate', // Afiliado
  OPERATOR = 'operator',   // Operador
  GESTOR = 'gestor'        // Gestor
}
```

## 🌐 Deploy e Produção

### Deploy Automático (Vercel)

```bash
# Deploy para produção
npm run deploy

# Ou via Git (automático)
git push origin main
```

### URLs de Produção

- **Frontend**: https://coinbitclub-frontend-premium.vercel.app
- **Backend**: https://coinbitclub-market-bot.up.railway.app
- **Status**: https://coinbitclub-market-bot.up.railway.app/api/status

### Monitoramento

- Build automático no Vercel
- Logs em tempo real
- Métricas de performance
- Alerts de erro

## 🔧 Tecnologias Utilizadas

### Core Framework
- **Next.js 14.2.30**: Framework React com SSR/SSG
- **React 18**: Biblioteca de interface
- **TypeScript 5.9.2**: Tipagem estática

### Styling & UI
- **TailwindCSS 3.3.0**: Framework CSS utilitário
- **React Icons 5.5.0**: Biblioteca de ícones
- **Framer Motion**: Animações suaves

### Estado e Dados
- **Zustand**: Gerenciamento de estado
- **Axios**: Cliente HTTP
- **React Hot Toast**: Notificações

### Desenvolvimento
- **ESLint**: Linting de código
- **Prettier**: Formatação de código
- **Jest**: Testes unitários
- **Playwright**: Testes E2E

## 🔗 Integração com Backend

### Endpoints Principais

```typescript
// Autenticação
POST /api/auth/login
POST /api/auth/register
POST /api/auth/verify-phone

// Dashboard
GET /api/user/dashboard
GET /api/admin/dashboard

// Operações
GET /api/user/operations
POST /api/user/trading

// Sistema
GET /api/status
GET /api/health/exchanges
```

### Configuração API

```typescript
// lib/api.ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

## 🚨 Solução de Problemas

### Problemas Comuns

1. **Erro de Build TypeScript**
   ```bash
   npm run type-check
   npm run lint:fix
   ```

2. **Problema de Conexão API**
   ```bash
   # Verificar variáveis de ambiente
   echo $NEXT_PUBLIC_API_URL
   ```

3. **Erro de Dependências**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Logs e Debug

```bash
# Verificar logs do Vercel
vercel logs [deployment-url]

# Debug local
DEBUG=* npm run dev
```

## 📚 Documentação Adicional

- [Guia de Desenvolvimento](./documentation/guides/)
- [Relatórios de Deploy](./documentation/deployment/)
- [Configuração de Ambiente](./CONFIGURACAO-VARIAVEIS-AMBIENTE.md)
- [Integração Completa](./PLANO-INTEGRACAO-COMPLETA-FRONTEND-BACKEND.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Email**: suporte@coinbitclub.com
- **Discord**: [CoinBitClub Community](https://discord.gg/coinbitclub)
- **Issues**: [GitHub Issues](https://github.com/coinbitclub/coinbitclub-market-bot/issues)

---

**Desenvolvido com ❤️ pela equipe CoinBitClub**

*Última atualização: Agosto 2025*
