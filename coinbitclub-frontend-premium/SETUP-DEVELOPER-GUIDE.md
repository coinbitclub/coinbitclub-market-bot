# 🚀 CoinBitClub Market Bot - Guia de Setup para Desenvolvedores

## 📋 Visão Geral

Este guia fornece instruções completas para configurar o ambiente de desenvolvimento do CoinBitClub Market Bot, desde a instalação até o primeiro deploy.

## 📋 Pré-requisitos

### 🔧 Software Necessário

| Software | Versão Mínima | Versão Recomendada | Download |
|----------|---------------|-------------------|----------|
| **Node.js** | 18.0.0 | 20.0.0+ | [nodejs.org](https://nodejs.org/) |
| **Yarn** | 1.22.0 | Latest | [yarnpkg.com](https://yarnpkg.com/) |
| **Git** | 2.30.0 | Latest | [git-scm.com](https://git-scm.com/) |
| **VS Code** | 1.70.0 | Latest | [code.visualstudio.com](https://code.visualstudio.com/) |
| **PostgreSQL** | 13.0 | 15.0+ | [postgresql.org](https://postgresql.org/) |

### 🌐 Contas Necessárias

- **GitHub**: Para repositório e CI/CD
- **Vercel**: Para deploy do frontend
- **Railway**: Para backend e banco de dados
- **Stripe**: Para processamento de pagamentos

## 🔧 Configuração do Ambiente

### 1️⃣ Clone do Repositório

```bash
# Clone o repositório
git clone https://github.com/coinbitclub/coinbitclub-market-bot.git
cd coinbitclub-market-bot/coinbitclub-frontend-premium

# Ou clone via SSH (recomendado)
git clone git@github.com:coinbitclub/coinbitclub-market-bot.git
cd coinbitclub-market-bot/coinbitclub-frontend-premium
```

### 2️⃣ Instalação de Dependências

```bash
# Instalar dependências com Yarn (recomendado)
yarn install

# Ou com npm
npm install

# Verificar se tudo foi instalado corretamente
yarn --version
node --version
```

### 3️⃣ Configuração de Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env.local

# Editar variáveis de ambiente
code .env.local
```

**Arquivo `.env.local`:**
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_APP_VERSION=3.0.0

# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3001

# Database (se executando localmente)
DATABASE_URL=postgresql://user:password@localhost:5432/coinbitclub

# Stripe (chaves de teste)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# External APIs
TRADING_API_KEY=your-trading-api-key
AI_SERVICE_URL=https://ai-service.com/api
```

### 4️⃣ Configuração do VS Code

**Extensões Recomendadas:**
```bash
# Instalar via CLI do VS Code
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension formulahendry.auto-rename-tag
code --install-extension christian-kohler.path-intellisense
```

**Configuração do Workspace (`.vscode/settings.json`):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^\"'`]*)(?:'|\"|`)"],
    ["classnames\\(([^)]*)\\)", "(?:'|\"|`)([^\"'`]*)(?:'|\"|`)"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

## 🚀 Execução do Projeto

### 🎯 Desenvolvimento Local

```bash
# Executar servidor de desenvolvimento
yarn dev

# Ou com npm
npm run dev

# Projeto estará disponível em:
# http://localhost:3001
```

### 🔍 Scripts Disponíveis

```bash
# Desenvolvimento
yarn dev              # Servidor de desenvolvimento
yarn dev:debug       # Servidor com debug habilitado

# Build e Produção
yarn build            # Build para produção
yarn start            # Servidor de produção
yarn preview          # Preview do build

# Qualidade de Código
yarn lint             # Verificação ESLint
yarn lint:fix         # Correção automática ESLint
yarn format           # Formatação com Prettier
yarn format:check     # Verificação de formatação
yarn type-check       # Verificação de tipos TypeScript

# Testes
yarn test             # Todos os testes
yarn test:unit        # Testes unitários (Jest)
yarn test:e2e         # Testes E2E (Playwright)
yarn test:watch       # Testes em modo watch
yarn test:coverage    # Testes com coverage

# Utilitários
yarn clean            # Limpeza de cache e build
yarn reset            # Reset completo do projeto
yarn deps:update      # Atualização de dependências
yarn analyze          # Análise do bundle
```

## 🗄️ Configuração do Banco de Dados

### 🐘 PostgreSQL Local

```bash
# Instalar PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Instalar PostgreSQL (Ubuntu)
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Criar banco de dados
createdb coinbitclub_dev

# Conectar ao banco
psql coinbitclub_dev
```

### 🌐 Railway (Produção)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login no Railway
railway login

# Conectar ao projeto
railway link

# Executar comandos no banco de produção
railway run psql $DATABASE_URL
```

### 📊 Migrações de Banco

```bash
# Executar migrações
yarn migrate

# Criar nova migração
yarn migrate:create "add_new_table"

# Reset do banco (CUIDADO!)
yarn migrate:reset

# Seed do banco com dados de teste
yarn seed
```

## 🔧 Configuração de Ferramentas

### 📝 ESLint + Prettier

O projeto vem pré-configurado com ESLint e Prettier. Configurações em:
- `.eslintrc.js` - Regras do ESLint
- `.prettierrc` - Configurações do Prettier
- `.prettierignore` - Arquivos ignorados pelo Prettier

### 🎨 Tailwind CSS

Configuração do Tailwind em `tailwind.config.js`:
```javascript
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#00FFD1',
          900: '#0B0F1E',
        },
        accent: '#FFC300',
      },
    },
  },
  plugins: [],
}
```

### 🧪 Testes

**Jest** para testes unitários:
```bash
# Executar testes
yarn test

# Testes com watch mode
yarn test:watch

# Coverage report
yarn test:coverage
```

**Playwright** para testes E2E:
```bash
# Configurar Playwright
npx playwright install

# Executar testes E2E
yarn test:e2e

# Executar em modo debug
yarn test:e2e:debug
```

## 📦 Estrutura de Dependências

### 🎯 Dependências Principais

```json
{
  "dependencies": {
    "next": "14.2.30",
    "react": "18.2.0",
    "typescript": "5.0.0",
    "tailwindcss": "3.3.0",
    "axios": "1.6.0",
    "react-hot-toast": "2.4.1",
    "socket.io-client": "4.7.2",
    "@stripe/stripe-js": "2.1.0"
  }
}
```

### 🛠️ Dependências de Desenvolvimento

```json
{
  "devDependencies": {
    "@types/node": "20.0.0",
    "@types/react": "18.2.0",
    "eslint": "8.45.0",
    "prettier": "3.0.0",
    "jest": "29.6.0",
    "playwright": "1.36.0",
    "autoprefixer": "10.4.14",
    "postcss": "8.4.27"
  }
}
```

## 🚀 Deploy

### 🌐 Vercel (Frontend)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login no Vercel
vercel login

# Deploy de desenvolvimento
vercel

# Deploy de produção
vercel --prod

# Configurar domínio personalizado
vercel domains add yourdomain.com
```

### 🚂 Railway (Backend)

```bash
# Deploy via CLI
railway deploy

# Ou via GitHub (recomendado)
# 1. Conectar repositório ao Railway
# 2. Configurar variáveis de ambiente
# 3. Deploy automático via push
```

## 🔧 Troubleshooting

### ❌ Problemas Comuns

#### Node.js / Yarn
```bash
# Limpar cache do Yarn
yarn cache clean

# Reinstalar dependências
rm -rf node_modules yarn.lock
yarn install

# Verificar versão do Node
node --version
```

#### TypeScript
```bash
# Limpar cache do TypeScript
yarn type-check

# Regenerar tipos
rm -rf .next
yarn build
```

#### Tailwind CSS
```bash
# Regenerar classes Tailwind
rm -rf .next
yarn dev
```

### 🔍 Logs e Debug

```bash
# Logs detalhados do Next.js
DEBUG=* yarn dev

# Logs do servidor
yarn dev 2>&1 | tee logs/dev.log

# Análise do bundle
yarn analyze
```

### 📊 Performance

```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# Bundle analyzer
yarn build
yarn analyze
```

## 📚 Recursos Adicionais

### 📖 Documentação

- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **React**: [reactjs.org/docs](https://reactjs.org/docs)
- **Tailwind**: [tailwindcss.com/docs](https://tailwindcss.com/docs)
- **TypeScript**: [typescriptlang.org/docs](https://typescriptlang.org/docs)

### 🎓 Tutorials

- **Next.js Tutorial**: [nextjs.org/learn](https://nextjs.org/learn)
- **React Tutorial**: [reactjs.org/tutorial](https://reactjs.org/tutorial)
- **TypeScript Handbook**: [typescriptlang.org/docs/handbook](https://typescriptlang.org/docs/handbook)

### 🤝 Comunidade

- **Discord**: [CoinBitClub Discord](https://discord.gg/coinbitclub)
- **GitHub Issues**: [github.com/coinbitclub/issues](https://github.com/coinbitclub/coinbitclub-market-bot/issues)
- **Stack Overflow**: Tag `coinbitclub-market-bot`

## ✅ Checklist de Setup

- [ ] Node.js 18+ instalado
- [ ] Yarn instalado e funcionando
- [ ] Repositório clonado
- [ ] Dependências instaladas (`yarn install`)
- [ ] Variáveis de ambiente configuradas (`.env.local`)
- [ ] VS Code com extensões instaladas
- [ ] PostgreSQL configurado (local ou Railway)
- [ ] Projeto executando (`yarn dev`)
- [ ] Testes passando (`yarn test`)
- [ ] Build funcionando (`yarn build`)
- [ ] Deploy configurado (Vercel/Railway)

## 🆘 Suporte

Se você encontrar problemas durante o setup:

1. **Verificar documentação** neste guia
2. **Buscar issues** no GitHub
3. **Criar nova issue** com detalhes do problema
4. **Contatar equipe** via Discord/Slack

---

**📅 Última Atualização**: 28 de Julho de 2025  
**👨‍💻 Versão do Guia**: 3.0.0  
**🎯 Compatibilidade**: Node.js 18+, Next.js 14+  
**💡 Tip**: Use yarn para melhor performance e lock files consistentes
