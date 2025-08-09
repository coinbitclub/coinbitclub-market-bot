# 🔐 CREDENCIAIS DE TESTE - CoinBitClub

## 👤 Usuário de Teste

**📧 Email:** `teste1753396801233@coinbitclub.com`
**🔑 Senha:** `test123`
**🎭 Role:** `user`
**👤 Nome:** `Usuário Teste`

---

## 🚀 Como usar:

### 1. Login no Sistema
- Acesse: http://localhost:3001/auth/login
- Digite o email e senha acima
- Será redirecionado automaticamente para `/user/dashboard`

### 2. Criar novo usuário de teste
- Acesse: http://localhost:3001/auth/register
- Use qualquer email no formato: `teste[NUMERO]@coinbitclub.com`
- Use a senha: `test123`
- Nome: `Usuário Teste [NUMERO]`

---

## 🎯 URLs Disponíveis:

### 🔐 Autenticação
- **Login:** http://localhost:3001/auth/login
- **Registro:** http://localhost:3001/auth/register

### 👨‍💼 Área do Usuário
- **Dashboard:** http://localhost:3001/user/dashboard
- **Operações:** http://localhost:3001/user/operations
- **Planos:** http://localhost:3001/user/plans
- **Configurações:** http://localhost:3001/user/settings

### 🏢 Área do Afiliado
- **Dashboard:** http://localhost:3001/affiliate/dashboard
- **Comissões:** http://localhost:3001/affiliate/commissions

### 🔧 Área Admin
- **Dashboard:** http://localhost:3001/admin/dashboard

---

## 📊 Backend API (Porta 9997)

### 🔐 Autenticação
- `POST /api/auth/login`
- `POST /api/auth/register`

### 👤 Usuário
- `GET /api/user/dashboard`
- `GET /api/user/operations`
- `GET /api/user/plans`
- `GET /api/user/settings`

### 🏢 Afiliado
- `GET /api/affiliate/dashboard`
- `GET /api/affiliate/commissions`

---

## 🗄️ Banco de Dados
- **PostgreSQL Railway**
- **Host:** yamabiko.proxy.rlwy.net:32866
- **Database:** railway
- **Status:** ✅ Conectado

---

## ⚡ Sistema Ativo
- **Frontend:** http://localhost:3001 ✅
- **Backend:** http://localhost:9997 ✅
- **Database:** PostgreSQL Railway ✅

**Tudo funcionando perfeitamente!** 🎉
