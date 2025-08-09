# 🔄 DADOS PARA MIGRAÇÃO - MAURO ALVES E PALOMA AMARAL

## 👤 USUÁRIO 1: MAURO ALVES

### 📊 Dados Básicos
```
ID: acedfd2a-6e8d-4c9f-bbe7-885de925397e
Nome: MAURO ALVES
Email: mauroalves150391@gmail.com
Role: user
Status: trial_active
User Type: user
Is Active: true
Created At: 2025-07-22 14:01:51.746142+00
```

### 👤 Perfil
```
Profile ID: 2d7f3003-bd36-4192-b603-de28c5ca651a
First Name: MAURO
Last Name: ALVES
Phone: +551131138391
Country: BR
WhatsApp: None
Account Type: testnet
Created At: 2025-07-24 21:38:05.368056+00
```

### 🔑 Credenciais (Tabela: credentials)
```
Credential ID: 2
Exchange: bybit-testnet
API Key: JQVNAD0aCqNqPLvo25
API Secret: rQ1Qle81XBKeL5NrvSIOLqpT60rbZ7wA0dYk
Is Active: true
Created At: 2025-07-22 14:07:38.044459
```

---

## 👤 USUÁRIO 2: PALOMA AMARAL

### 📊 Dados Básicos
```
ID: 91a4cdc2-12a5-47f9-a01d-3e4e5fb86af4
Nome: PALOMA AMARAL
Email: pamaral15@hotmail.com
Role: user
Status: active
User Type: user
Is Active: true
Created At: 2025-07-27 01:32:11.330475+00
```

### 👤 Perfil
```
Profile ID: baccacf1-993a-4321-8ed1-948083887ab6
First Name: PALOMA
Last Name: AMARAL
Phone: +5521982218182
Country: BR
WhatsApp: +5521982218182
Account Type: real
Created At: 2025-07-27 01:32:11.485805+00
```

### 🔑 Credenciais (Tabela: credentials)
```
Credential ID: 4
Exchange: bybit
API Key: AfFEGdxLuYPnSFaXEJ
API Secret: kxCAy7yDenRFKKrHinGfysmP2wknmvRk16Wb
Is Active: true
Created At: 2025-07-27 01:32:11.630777
```

---

## 📋 SCRIPT SQL PARA MIGRAÇÃO

### 🗃️ Para inserir no ambiente real:

```sql
-- 1. INSERIR USUÁRIOS
INSERT INTO users (
    id, 
    name, 
    email, 
    role, 
    status, 
    user_type, 
    is_active, 
    created_at
) VALUES 
(
    'acedfd2a-6e8d-4c9f-bbe7-885de925397e',
    'MAURO ALVES',
    'mauroalves150391@gmail.com',
    'user',
    'trial_active',
    'user',
    true,
    '2025-07-22 14:01:51.746142+00'
),
(
    '91a4cdc2-12a5-47f9-a01d-3e4e5fb86af4',
    'PALOMA AMARAL',
    'pamaral15@hotmail.com',
    'user',
    'active',
    'user',
    true,
    '2025-07-27 01:32:11.330475+00'
);

-- 2. INSERIR PERFIS
INSERT INTO user_profiles (
    id,
    user_id,
    first_name,
    last_name,
    phone,
    country,
    whatsapp,
    account_type,
    created_at
) VALUES
(
    '2d7f3003-bd36-4192-b603-de28c5ca651a',
    'acedfd2a-6e8d-4c9f-bbe7-885de925397e',
    'MAURO',
    'ALVES',
    '+551131138391',
    'BR',
    NULL,
    'testnet',
    '2025-07-24 21:38:05.368056+00'
),
(
    'baccacf1-993a-4321-8ed1-948083887ab6',
    '91a4cdc2-12a5-47f9-a01d-3e4e5fb86af4',
    'PALOMA',
    'AMARAL',
    '+5521982218182',
    'BR',
    '+5521982218182',
    'real',
    '2025-07-27 01:32:11.485805+00'
);

-- 3. INSERIR CREDENCIAIS
INSERT INTO credentials (
    id,
    user_id,
    exchange,
    api_key,
    api_secret,
    is_active,
    created_at
) VALUES
(
    2,
    'acedfd2a-6e8d-4c9f-bbe7-885de925397e',
    'bybit-testnet',
    'JQVNAD0aCqNqPLvo25',
    'rQ1Qle81XBKeL5NrvSIOLqpT60rbZ7wA0dYk',
    true,
    '2025-07-22 14:07:38.044459'
),
(
    4,
    '91a4cdc2-12a5-47f9-a01d-3e4e5fb86af4',
    'bybit',
    'AfFEGdxLuYPnSFaXEJ',
    'kxCAy7yDenRFKKrHinGfysmP2wknmvRk16Wb',
    true,
    '2025-07-27 01:32:11.630777'
);
```

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

### 🔍 Status das Chaves API:
- **MAURO**: Chave testnet (não funcionou nos testes)
- **PALOMA**: ✅ Chave produção FUNCIONANDO (testada com sucesso)

### 🎯 Recomendações:
1. **PALOMA**: Migrar completa - chave está funcional
2. **MAURO**: Migrar dados, mas talvez precisar gerar nova chave válida
3. **IP Railway**: `132.255.160.140` (já confirmado)

### 🔒 Configuração Recomendada para Produção:
```bash
# Use a chave da PALOMA que está funcionando
BYBIT_API_KEY=AfFEGdxLuYPnSFaXEJ
BYBIT_SECRET_KEY=kxCAy7yDenRFKKrHinGfysmP2wknmvRk16Wb
RAILWAY_STATIC_IP=132.255.160.140
```

---

## ✅ CHECKLIST DE MIGRAÇÃO

- [ ] Inserir dados do MAURO ALVES
- [ ] Inserir dados da PALOMA AMARAL
- [ ] Verificar IDs únicos no ambiente destino
- [ ] Testar login dos usuários
- [ ] Validar chaves API
- [ ] Configurar sistema com chave da PALOMA
