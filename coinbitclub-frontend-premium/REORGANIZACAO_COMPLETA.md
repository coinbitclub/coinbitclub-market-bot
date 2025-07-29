# 🔄 REORGANIZAÇÃO COMPLETA DO FRONTEND - COINBITCLUB

## 🎯 PROBLEMA IDENTIFICADO
O escopo atual entregue não atende à documentação completa que prevê **5 perfis diferentes de usuários** com dashboards especializados e múltiplas páginas por perfil.

## 📊 ESTRUTURA COMPLETA NECESSÁRIA

### **1. ADMIN (Administrador Geral)**
#### Páginas Necessárias:
- `/admin/dashboard` - Dashboard executivo principal
- `/admin/users` - Gestão completa de usuários  
- `/admin/operations` - Monitoramento de todas operações
- `/admin/affiliates` - Gestão do programa de afiliados
- `/admin/accounting` - Controle financeiro e contabilidade
- `/admin/settings` - Configurações do sistema
- `/admin/alerts` - Sistema de alertas críticos
- `/admin/reports` - Relatórios executivos

### **2. GESTOR (Gestor Operacional)**  
#### Páginas Necessárias:
- `/gestor/dashboard` - Dashboard operacional
- `/gestor/operations` - Gestão de operações
- `/gestor/affiliates` - Gestão de afiliados
- `/gestor/commissions` - Gerenciamento de comissões
- `/gestor/reports` - Relatórios operacionais
- `/gestor/users` - Gestão básica de usuários

### **3. OPERADOR (Operador de Trading)**
#### Páginas Necessárias:
- `/operador/dashboard` - Dashboard de operações
- `/operador/trading` - Interface de trading
- `/operador/monitoring` - Monitoramento em tempo real
- `/operador/signals` - Central de sinais
- `/operador/performance` - Análise de performance

### **4. AFILIADO (Afiliado/Parceiro)**
#### Páginas Necessárias:
- `/affiliate/dashboard` - Dashboard de comissões
- `/affiliate/referrals` - Gestão de indicações
- `/affiliate/commissions` - Histórico de comissões
- `/affiliate/reports` - Relatórios de performance
- `/affiliate/materials` - Materiais de marketing

### **5. USUARIO (Usuário Final)**
#### Páginas Necessárias:
- `/user/dashboard` - Dashboard pessoal
- `/user/operations` - Histórico de operações
- `/user/balance` - Gestão de saldo
- `/user/settings` - Configurações pessoais
- `/user/profile` - Perfil do usuário
- `/user/plans` - Planos e assinaturas

## 🛠️ IMPLEMENTAÇÃO PRIORITÁRIA

### **FASE 1: ESTRUTURA BASE (Hoje)**
1. ✅ Reorganizar sistema de rotas por perfil
2. ✅ Implementar middleware de autorização
3. ✅ Criar layouts específicos por perfil
4. ✅ Expandir authStore para 5 perfis

### **FASE 2: DASHBOARDS PRINCIPAIS (Amanhã)**
1. ✅ Dashboard Admin completo
2. ✅ Dashboard Gestor operacional
3. ✅ Dashboard Operador trading
4. ✅ Dashboard Afiliado comissões
5. ✅ Dashboard Usuario pessoal

### **FASE 3: PÁGINAS ESPECIALIZADAS (Esta Semana)**
1. ✅ Páginas de gestão por perfil
2. ✅ Integração APIs específicas
3. ✅ Componentes especializados
4. ✅ Sistema de permissões granular

## 🔧 MUDANÇAS TÉCNICAS NECESSÁRIAS

### **1. Sistema de Rotas**
```typescript
// middleware/auth.ts - Controle de acesso por perfil
const ROLE_ROUTES = {
  ADMIN: ['/admin/**'],
  GESTOR: ['/gestor/**', '/admin/operations', '/admin/affiliates'],
  OPERADOR: ['/operador/**'],
  AFILIADO: ['/affiliate/**'],
  USUARIO: ['/user/**']
}
```

### **2. Layout por Perfil**
```typescript
// components/layout/
├── AdminLayout.tsx
├── GestorLayout.tsx  
├── OperadorLayout.tsx
├── AffiliateLayout.tsx
└── UserLayout.tsx
```

### **3. Componentes Especializados**
```typescript
// components/dashboard/
├── AdminDashboard/
├── GestorDashboard/
├── OperadorDashboard/
├── AffiliateDashboard/
└── UserDashboard/
```

### **4. APIs por Perfil**
```typescript
// services/api/
├── adminApi.ts
├── gestorApi.ts
├── operadorApi.ts
├── affiliateApi.ts
└── userApi.ts
```

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### **Sistema Base**
- [ ] Middleware de autorização por perfil
- [ ] Layouts específicos por perfil
- [ ] Navegação adaptativa por role
- [ ] Sistema de permissões granular

### **Dashboards**
- [ ] AdminDashboard com métricas executivas
- [ ] GestorDashboard com operações
- [ ] OperadorDashboard com trading
- [ ] AffiliateDashboard com comissões
- [ ] UserDashboard com dados pessoais

### **Páginas Especializadas**
- [ ] 8 páginas Admin
- [ ] 6 páginas Gestor
- [ ] 5 páginas Operador
- [ ] 5 páginas Afiliado
- [ ] 5 páginas Usuario

### **Integração Backend**
- [ ] APIs específicas por perfil
- [ ] WebSocket por tipo de usuário
- [ ] Dados reais 100%
- [ ] Sistema de permissões

## 🎯 OBJETIVO FINAL

**Entregar frontend completo com 29 páginas especializadas, 5 perfis de usuário com dashboards específicos, integração 100% real com backend Railway, experiência premium por perfil.**

---

**📅 CRONOGRAMA**: Conclusão em 3 dias com foco total na implementação das páginas faltantes e especialização por perfil.
