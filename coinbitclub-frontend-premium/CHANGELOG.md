# 📋 Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [2.1.0] - 2025-08-02

### ✅ Adicionado
- Sistema de recuperação de senha integrado com SMS
- Interface moderna para forgot-password-integrated.tsx
- Verificação de código SMS em 3 etapas
- Validação robusta de senhas com confirmação
- Animações e transições suaves na interface

### 🔧 Corrigido
- **CRÍTICO**: Resolvido erro "Erro interno do servidor" no registro
- Corrigidos URLs de API para apontar para Railway backend
- Corrigidos 29+ erros de compilação TypeScript
- Corrigida interface FinancialSummary em accounting-new.tsx
- Substituído hook useAuth problemático por implementação local
- Corrigidos imports de React Icons inexistentes (FiBarChart3 → FiBarChart2, FiStop → FiSquare)
- Corrigido import UserLayout de named para default export
- Corrigidos variants de Button e Badge para valores válidos

### 🏗️ Modificado
- Migradas dependências críticas para production (TypeScript, autoprefixer, postcss, tailwindcss)
- Atualizada estrutura de componentes UI
- Melhorada experiência de usuário com loading states
- Otimizada performance de build

### 🚀 Deploy
- **SUCCESS**: Deploy em produção no Vercel completado
- Build otimizado com 104 páginas geradas
- Integração ativa com backend Railway
- Pipeline de CI/CD funcionando

## [2.0.1] - 2025-08-01

### 🔧 Corrigido
- Corrigidos problemas de autenticação
- Melhorada integração com backend Railway
- Corrigidos tipos TypeScript em vários componentes

### 📚 Documentação
- Atualizado README.md com informações completas
- Adicionados badges de tecnologias
- Documentada arquitetura do sistema
- Criado guia de contribuição

## [2.0.0] - 2025-07-30

### 🎉 Lançamento Inicial
- Sistema completo de trading de criptomoedas
- Dashboard interativo para usuários
- Painel administrativo completo
- Sistema de afiliados
- Autenticação com JWT e SMS
- Interface responsiva com TailwindCSS
- Integração com backend Railway

### 🏗️ Tecnologias
- Next.js 14.2.30
- TypeScript 5.9.2
- React 18
- TailwindCSS 3.3.0
- Vercel Deploy

---

## 🔄 Tipos de Mudanças

- `✅ Adicionado` para novas funcionalidades
- `🔧 Corrigido` para correções de bugs
- `🏗️ Modificado` para mudanças em funcionalidades existentes
- `🗑️ Removido` para funcionalidades removidas
- `🚀 Deploy` para mudanças relacionadas a deployment
- `📚 Documentação` para mudanças na documentação
- `🔒 Segurança` para vulnerabilidades corrigidas

## 🔗 Links Úteis

- [Repositório GitHub](https://github.com/coinbitclub/coinbitclub-market-bot)
- [Deploy Vercel](https://coinbitclub-frontend-premium.vercel.app)
- [Backend Railway](https://coinbitclub-market-bot.up.railway.app)
- [Documentação Completa](./documentation/)

---

**Mantido pela equipe CoinBitClub** | *Última atualização: 02/08/2025*
