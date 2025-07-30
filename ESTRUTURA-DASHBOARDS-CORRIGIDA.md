# 📊 ESTRUTURA DE DASHBOARDS E REDIRECIONAMENTOS - COINBITCLUB

## 🎯 **Dashboard Principal do Projeto**

O projeto **CoinBitClub** utiliza um **dashboard único** para todos os perfis:

### **Rota Principal:**
```
/dashboard-premium
```

## 📋 **Estrutura de Perfis e Permissões**

### **1. ADMIN** 👑
- **Dashboard**: `/dashboard-premium`
- **Acesso**: Todas as áreas do sistema
- **Permissões Especiais**: 
  - Área administrativa (`/admin/*`)
  - Gestão de usuários
  - Configurações do sistema
  - Todas as funcionalidades

### **2. GESTOR** 🏢
- **Dashboard**: `/dashboard-premium`
- **Acesso**: 
  - Dashboard principal
  - Operações (`/operador/*`)
  - Afiliados (`/affiliate/*`)
  - Usuários (`/user/*`)
  - Algumas áreas admin específicas

### **3. OPERADOR** ⚙️
- **Dashboard**: `/dashboard-premium`
- **Acesso**:
  - Dashboard principal
  - Operações de trading
  - Área de usuários

### **4. AFILIADO** 💰
- **Dashboard**: `/dashboard-premium`
- **Acesso**:
  - Dashboard principal
  - Sistema de afiliados
  - Área de usuários

### **5. USUARIO** 👤
- **Dashboard**: `/dashboard-premium`
- **Acesso**:
  - Dashboard principal
  - Área pessoal do usuário
  - Operações próprias

## 🔄 **Middleware - Regras de Redirecionamento**

### **Middleware (`middleware.ts`)**
```typescript
// Todos os perfis são redirecionados para o dashboard principal
const getDashboardRoute = (role: string): string => {
  return '/dashboard-premium'; // Dashboard único do projeto
};
```

### **Páginas de Login**
```typescript
// Após login bem-sucedido, todos vão para:
const redirectPath = '/dashboard-premium';
```

## 📁 **Estrutura de Arquivos**

### **Dashboard Principal:**
```
pages/
├── dashboard-premium.tsx      ← DASHBOARD PRINCIPAL
├── dashboard.tsx              ← Dashboard secundário
└── dashboard-simple.tsx      ← Dashboard simplificado
```

### **Dashboards Específicos (Backup/Alternativo):**
```
pages/
├── admin/
│   ├── dashboard.tsx
│   ├── dashboard-premium.tsx
│   └── ...outras páginas admin
├── affiliate/
│   └── dashboard.tsx
├── user/
│   └── dashboard.tsx
├── gestor/
│   └── dashboard.tsx
└── operador/
    └── dashboard.tsx
```

## 🛡️ **Controle de Acesso**

### **Middleware Logic:**
```typescript
// ADMIN - Acesso total
if (userRole === 'ADMIN') {
  hasAccess = true; // Pode acessar qualquer área
}

// GESTOR - Acesso amplo
else if (userRole === 'GESTOR') {
  hasAccess = pathname.startsWith('/gestor') || 
             pathname.startsWith('/operador') || 
             pathname.startsWith('/affiliate') || 
             pathname.startsWith('/user') ||
             pathname.startsWith('/dashboard') ||
             pathname === '/admin/operations' ||
             pathname === '/admin/affiliates';
}

// OPERADOR - Operações + User
else if (userRole === 'OPERADOR') {
  hasAccess = pathname.startsWith('/operador') || 
             pathname.startsWith('/user') ||
             pathname.startsWith('/dashboard');
}

// AFILIADO - Affiliates + User
else if (userRole === 'AFILIADO') {
  hasAccess = pathname.startsWith('/affiliate') || 
             pathname.startsWith('/user') ||
             pathname.startsWith('/dashboard');
}

// USUARIO - Apenas User + Dashboard
else if (userRole === 'USUARIO') {
  hasAccess = pathname.startsWith('/user') ||
             pathname.startsWith('/dashboard');
}
```

## 🎨 **Dashboard Premium - Funcionalidades**

O arquivo `dashboard-premium.tsx` é o dashboard principal e contém:

### **Recursos Principais:**
- ✅ **Multi-perfil**: Adapta conteúdo baseado no role do usuário
- ✅ **Trading Interface**: Mostra operações ativas e histórico
- ✅ **Métricas**: Saldo, lucro, índice de acerto
- ✅ **Robot Status**: Status dos robôs de trading
- ✅ **Real-time Updates**: Atualização automática de dados
- ✅ **Responsive Design**: Interface adaptativa

### **API Endpoints:**
```typescript
// O dashboard carrega dados baseado no perfil
switch (user.role) {
  case 'admin':
    data = await DashboardService.getAdminDashboard();
    break;
  case 'affiliate':
    data = await DashboardService.getAffiliateDashboard();
    break;
  default:
    data = await DashboardService.getUserDashboard();
}
```

## 🚀 **Implementação Atual**

### **Status das Correções:**
- ✅ **Middleware atualizado** para usar `/dashboard-premium`
- ✅ **AuthStore atualizado** para redirecionar corretamente
- ✅ **Login-premium atualizado** para usar dashboard principal
- ✅ **Controle de acesso** configurado por perfil
- ✅ **Dashboard premium** funcionando para todos os perfis

### **Fluxo de Login:**
1. **Login** → `pages/auth/login-premium.tsx`
2. **Autenticação** → Middleware verifica token e role
3. **Redirecionamento** → `/dashboard-premium` para todos os perfis
4. **Dashboard** → Carrega conteúdo baseado no role do usuário

## 📝 **Notas Importantes**

1. **Dashboard Único**: O projeto usa um dashboard principal adaptativo
2. **Role-based Content**: O conteúdo muda baseado no perfil, não a URL
3. **Acesso Controlado**: Middleware controla acesso a áreas específicas
4. **Fallback**: Sempre redireciona para `/dashboard-premium` se não autorizado

---
**Atualizado**: 30/07/2025  
**Status**: ✅ Dashboards e redirecionamentos corrigidos  
**Dashboard Principal**: `/dashboard-premium`  
**Perfis Suportados**: ADMIN, GESTOR, OPERADOR, AFILIADO, USUARIO
