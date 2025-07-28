# 🔑 CREDENCIAIS DE LOGIN - TESTADAS

## ✅ CREDENCIAIS FUNCIONANDO (todas com senha: **password**)

### 👨‍💼 Admin
- **Email**: `admin@coinbitclub.com`
- **Senha**: `password`
- **Acesso**: Dashboard Admin

### � Fale Conosco (que você estava testando)
- **Email**: `faleconosco@coinbitclub.vip`
- **Senha**: `password`
- **Acesso**: Dashboard Usuário

### 👤 Outros Usuários Teste
- **Email**: `user@test.com`
- **Senha**: `password`

- **Email**: `usuario@coinbitclub.com` 
- **Senha**: `password`

- **Email**: `demo@coinbitclub.com`
- **Senha**: `password`

## 🔧 PROBLEMA IDENTIFICADO E CORRIGIDO

O erro "Erro de conexão" era causado por:
1. ❌ Login tentando conectar na porta 8081 (incorreta)
2. ✅ **CORRIGIDO**: Agora conecta na porta 8080 (correta)

## 🌐 URLs Corretas

- **Login**: http://localhost:3002/auth/login
- **Backend**: http://localhost:8080 (corrigido de 8081)
- **Frontend**: http://localhost:3002

## 🎯 TESTE AGORA

1. Vá para: http://localhost:3002/auth/login
2. Use: `faleconosco@coinbitclub.vip` / `password`
3. Deve funcionar perfeitamente agora!

---
**✅ CORRIGIDO**: 24/07/2025 - Porta do backend corrigida
