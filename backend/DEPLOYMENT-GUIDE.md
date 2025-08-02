# 🚀 Deployment Guide - CoinBitClub Market Bot

![Railway](https://img.shields.io/badge/Railway-Deployed-purple.svg)
![Status](https://img.shields.io/badge/Production-Ready-green.svg)
![Uptime](https://img.shields.io/badge/Uptime-99.9%25-brightgreen.svg)

## 📋 Índice

- [🌐 Visão Geral](#visão-geral)
- [☁️ Railway Deployment](#railway-deployment)
- [🔧 Configuração de Ambiente](#configuração-de-ambiente)
- [📊 Database Setup](#database-setup)
- [🚀 Deploy Process](#deploy-process)
- [📊 Monitoramento Pós-Deploy](#monitoramento-pós-deploy)
- [🔄 CI/CD Pipeline](#cicd-pipeline)
- [🛠️ Troubleshooting](#troubleshooting)
- [📈 Scaling e Performance](#scaling-e-performance)

---

## 🌐 Visão Geral

O CoinBitClub Market Bot está configurado para deploy automático no **Railway** com integração completa, monitoramento em tempo real e auto-scaling baseado na demanda.

### 🎯 Características do Deploy

- ✅ **Deploy Automático** - GitHub integration
- ✅ **Zero Downtime** - Rolling updates
- ✅ **Auto Scaling** - Based on CPU/Memory
- ✅ **Health Checks** - Automated monitoring
- ✅ **SSL/HTTPS** - Automatic certificates
- ✅ **CDN** - Global edge locations

### 📊 Ambientes

| Ambiente | URL | Uso |
|----------|-----|-----|
| **Development** | `localhost:3000` | Desenvolvimento local |
| **Staging** | `staging-coinbitclub.railway.app` | Testes e validação |
| **Production** | `coinbitclub-market-bot.railway.app` | Produção ativa |

---

## ☁️ Railway Deployment

### 🚀 Setup Inicial

#### 1. **Conta Railway**

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login na conta
railway login

# Verificar projetos
railway list
```

#### 2. **Conectar Repositório**

```bash
# Na pasta do projeto
cd coinbitclub-market-bot/backend

# Inicializar Railway
railway init

# Conectar GitHub repository
railway connect
```

#### 3. **Configurar Projeto**

```bash
# Criar novo projeto
railway new

# Ou conectar a projeto existente
railway link [PROJECT_ID]
```

### 📊 Configuração Railway

#### **railway.json**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install",
    "startCommand": "npm start"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### **package.json Scripts**

```json
{
  "scripts": {
    "start": "node main.js",
    "build": "echo 'Build completed'",
    "railway:deploy": "railway up",
    "railway:logs": "railway logs",
    "railway:shell": "railway shell"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## 🔧 Configuração de Ambiente

### 🔐 Variáveis de Ambiente

#### **Configuração via Railway Dashboard**

```bash
# Database
DATABASE_URL=postgresql://postgres:password@host:port/database

# Bybit API
BYBIT_API_KEY=your_production_api_key
BYBIT_API_SECRET=your_production_api_secret
BYBIT_TESTNET=false

# Sistema
NODE_ENV=production
PORT=3000
WEBHOOK_SECRET=your_secure_webhook_secret

# Railway específicas
RAILWAY_STATIC_URL=https://coinbitclub-market-bot.railway.app
RAILWAY_PROJECT_ID=your_project_id
RAILWAY_SERVICE_NAME=backend

# Monitoramento
LOG_LEVEL=info
ENABLE_METRICS=true
HEALTH_CHECK_ENDPOINT=/health

# Segurança
JWT_SECRET=your_jwt_secret
API_RATE_LIMIT=100
CORS_ORIGIN=https://coinbitclub-market-bot.railway.app

# WebSocket
WEBSOCKET_PORT=3016
WEBSOCKET_ENABLED=true

# IA Supervisors
AI_SUPERVISOR_ENABLED=true
FEAR_GREED_UPDATE_INTERVAL=900000

# Notificações
EMAIL_SERVICE_ENABLED=true
SMS_SERVICE_ENABLED=false
```

#### **Configuração via CLI**

```bash
# Configurar variáveis individualmente
railway variables set DATABASE_URL="postgresql://..."
railway variables set BYBIT_API_KEY="your_key"
railway variables set NODE_ENV="production"

# Configurar múltiplas variáveis de arquivo
railway variables set --file .env.production

# Verificar variáveis
railway variables

# Deletar variável
railway variables unset VARIABLE_NAME
```

### 🔒 Secrets Management

```bash
# Para dados sensíveis
railway variables set --sensitive API_SECRET="your_secret"

# Verificar secrets
railway variables --sensitive
```

---

## 📊 Database Setup

### 🐘 PostgreSQL Railway

#### 1. **Provisionar Database**

```bash
# Via Railway CLI
railway add postgresql

# Ou via dashboard Railway
# Add Service → Database → PostgreSQL
```

#### 2. **Configurar Connection**

```bash
# Obter connection string
railway variables get DATABASE_URL

# Testar conexão
railway shell
# Dentro do shell:
psql $DATABASE_URL
```

#### 3. **Aplicar Schema**

```bash
# Upload e aplicar schema
railway shell
node aplicar-schema-completo.js

# Ou via psql direto
railway shell
psql $DATABASE_URL -f _schema_completo_final.sql
```

#### 4. **Configurar Backup**

```yaml
# backup-config.yml no Railway
backup_schedule: "0 2 * * *"  # Daily at 2 AM
retention_days: 30
backup_type: "full"
encryption: true
```

---

## 🚀 Deploy Process

### 📝 Deploy Checklist

#### **Pré-Deploy**

- [ ] ✅ **Código testado** localmente
- [ ] ✅ **Variáveis configuradas** no Railway
- [ ] ✅ **Database preparado** com schema aplicado
- [ ] ✅ **Secrets configurados** adequadamente
- [ ] ✅ **Health checks** funcionando
- [ ] ✅ **Logs configurados** para produção

#### **Deploy Steps**

```bash
# 1. Verificar status atual
railway status

# 2. Deploy da aplicação
railway up

# 3. Verificar logs
railway logs --tail 100

# 4. Testar health endpoint
curl https://your-app.railway.app/api/health

# 5. Verificar dashboard
# https://your-app.railway.app/dashboard
```

### 🔄 Deploy Automático

#### **GitHub Actions Workflow**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Run tests
      run: npm test
      
    - name: Deploy to Railway
      uses: railway-app/railway-cli@v1
      with:
        command: up
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

#### **Configurar Railway Token**

```bash
# Obter token
railway login
railway tokens create

# Adicionar como secret no GitHub
# Repository → Settings → Secrets → RAILWAY_TOKEN
```

---

## 📊 Monitoramento Pós-Deploy

### 🏥 Health Checks

#### **Endpoint de Health**

```javascript
// health-check endpoint em server.js
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    checks: {
      database: checkDatabaseConnection(),
      websocket: checkWebSocketStatus(),
      gestores: checkGestoresStatus(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  };
  
  res.status(200).json(health);
});
```

#### **Railway Health Checks**

```json
{
  "healthCheck": {
    "path": "/health",
    "intervalSeconds": 30,
    "timeoutSeconds": 10,
    "unhealthyThreshold": 3
  }
}
```

### 📈 Métricas e Logs

#### **Monitoramento Railway**

```bash
# Logs em tempo real
railway logs --tail 50

# Logs históricos
railway logs --since 1h

# Métricas de performance
railway metrics

# Status dos serviços
railway status
```

#### **Alertas Customizados**

```javascript
// monitoring/alerts.js
const alerts = {
  highCpuUsage: {
    threshold: 80,
    duration: 300, // 5 minutes
    action: 'scale_up'
  },
  lowMemory: {
    threshold: 90,
    duration: 180, // 3 minutes
    action: 'restart'
  },
  databaseDisconnection: {
    threshold: 1,
    duration: 60, // 1 minute
    action: 'alert_team'
  }
};
```

### 📊 Dashboard de Monitoramento

#### **URLs de Monitoramento**

- **Railway Dashboard:** https://railway.app/project/your-project
- **Application Dashboard:** https://your-app.railway.app/dashboard
- **Health Check:** https://your-app.railway.app/health
- **API Status:** https://your-app.railway.app/api/monitoring/status

#### **Métricas Importantes**

```javascript
// Métricas a monitorar
const criticalMetrics = {
  response_time: '< 200ms',
  error_rate: '< 1%',
  uptime: '> 99.9%',
  cpu_usage: '< 70%',
  memory_usage: '< 80%',
  database_connections: '< 80% of limit',
  websocket_connections: 'stable',
  gestores_active: '6/6',
  supervisors_active: '2/2'
};
```

---

## 🔄 CI/CD Pipeline

### 🔧 Pipeline Completo

#### **Stages do Pipeline**

```mermaid
graph LR
    A[Code Push] --> B[Tests]
    B --> C[Build]
    C --> D[Security Scan]
    D --> E[Deploy Staging]
    E --> F[Integration Tests]
    F --> G[Deploy Production]
    G --> H[Health Checks]
    H --> I[Monitoring]
```

#### **GitHub Actions Avançado**

```yaml
name: Complete CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ env.NODE_VERSION }}
        
    - name: Cache dependencies
      uses: actions/cache@v3
      with:
        path: ~/.npm
        key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run linting
      run: npm run lint
      
    - name: Run unit tests
      run: npm run test:unit
      
    - name: Run integration tests
      run: npm run test:integration
      
  security:
    runs-on: ubuntu-latest
    needs: test
    steps:
    - uses: actions/checkout@v3
    
    - name: Security audit
      run: npm audit --audit-level moderate
      
    - name: Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        
  deploy-staging:
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.ref == 'refs/heads/develop'
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to staging
      uses: railway-app/railway-cli@v1
      with:
        command: up --service staging
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_STAGING_TOKEN }}
        
  deploy-production:
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      uses: railway-app/railway-cli@v1
      with:
        command: up --service production
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_PRODUCTION_TOKEN }}
        
    - name: Post-deploy health check
      run: |
        sleep 30
        curl -f https://coinbitclub-market-bot.railway.app/health || exit 1
        
    - name: Notify team
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        text: 'Production deployment completed!'
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 🛠️ Troubleshooting

### 🚨 Problemas Comuns

#### **1. Deploy Falha**

```bash
# Verificar logs de build
railway logs --service build

# Verificar variáveis de ambiente
railway variables

# Rebuild forçado
railway up --force

# Rollback se necessário
railway rollback
```

#### **2. Database Connection Issues**

```bash
# Testar conexão
railway shell
echo $DATABASE_URL
psql $DATABASE_URL -c "SELECT 1;"

# Verificar status do PostgreSQL
railway status postgresql

# Restart database se necessário
railway restart postgresql
```

#### **3. Performance Issues**

```bash
# Verificar métricas
railway metrics

# Escalar recursos
railway scale --replicas 2
railway scale --memory 1GB
railway scale --cpu 0.5

# Verificar logs de performance
railway logs --tail 100 | grep -i "slow\|timeout\|error"
```

#### **4. SSL/HTTPS Issues**

```bash
# Verificar certificado
curl -I https://your-app.railway.app

# Forçar renovação de certificado
railway domains refresh

# Verificar configuração de domínio
railway domains list
```

### 🔧 Scripts de Diagnóstico

```bash
# diagnose.sh - Script completo de diagnóstico
#!/bin/bash

echo "🔍 Railway Deployment Diagnostics"
echo "================================"

echo "📊 Project Status:"
railway status

echo -e "\n📈 Recent Deployments:"
railway deployments --limit 5

echo -e "\n🏥 Health Check:"
curl -s https://your-app.railway.app/health | jq

echo -e "\n📋 Environment Variables:"
railway variables | grep -v "SECRET\|KEY"

echo -e "\n📊 Resource Usage:"
railway metrics --json | jq '.cpu, .memory'

echo -e "\n📝 Recent Logs:"
railway logs --tail 20
```

---

## 📈 Scaling e Performance

### ⚡ Auto Scaling

#### **Configuração de Scaling**

```json
{
  "scaling": {
    "minReplicas": 1,
    "maxReplicas": 3,
    "targetCPU": 70,
    "targetMemory": 80,
    "scaleUpCooldown": 300,
    "scaleDownCooldown": 600
  }
}
```

#### **Métricas de Scaling**

```javascript
// scaling-metrics.js
const scalingRules = {
  cpu: {
    scaleUp: 70,    // Scale up when CPU > 70%
    scaleDown: 30,  // Scale down when CPU < 30%
    duration: 300   // For 5 minutes
  },
  memory: {
    scaleUp: 80,    // Scale up when Memory > 80%
    scaleDown: 40,  // Scale down when Memory < 40%
    duration: 300
  },
  responseTime: {
    scaleUp: 1000,  // Scale up when response > 1s
    duration: 180   // For 3 minutes
  }
};
```

### 🚀 Performance Optimization

#### **Database Optimization**

```sql
-- Índices para queries frequentes
CREATE INDEX CONCURRENTLY idx_user_operations_active 
ON user_operations(status) WHERE status = 'active';

CREATE INDEX CONCURRENTLY idx_trading_signals_recent 
ON trading_signals(received_at) WHERE received_at > NOW() - INTERVAL '24 hours';

-- Connection pooling
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
```

#### **Application Optimization**

```javascript
// performance-config.js
const config = {
  clustering: {
    enabled: true,
    workers: require('os').cpus().length
  },
  caching: {
    redis: {
      enabled: true,
      ttl: 300,
      host: process.env.REDIS_URL
    },
    memory: {
      enabled: true,
      maxSize: '100MB'
    }
  },
  compression: {
    enabled: true,
    level: 6
  }
};
```

### 📊 Load Testing

```bash
# Artillery load test
npm install -g artillery

# load-test.yml
config:
  target: https://coinbitclub-market-bot.railway.app
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20
  scenarios:
    - name: "Health check"
      requests:
        - get:
            url: "/health"
    - name: "API monitoring"
      requests:
        - get:
            url: "/api/monitoring/status"

# Executar teste
artillery run load-test.yml
```

---

## 📚 Resources e Best Practices

### 📖 Documentação Railway

- [Railway Documentation](https://docs.railway.app/)
- [Railway CLI Reference](https://docs.railway.app/cli/reference)
- [Deployment Guide](https://docs.railway.app/deploy/deployments)

### 🛡️ Security Best Practices

```bash
# Configurações de segurança recomendadas
railway variables set HELMET_ENABLED=true
railway variables set RATE_LIMIT_ENABLED=true
railway variables set CORS_STRICT=true
railway variables set LOG_SENSITIVE_DATA=false
```

### 🔄 Backup Strategy

```bash
# Script de backup automatizado
#!/bin/bash
# backup-production.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_production_${DATE}.sql"

# Database backup
railway run pg_dump $DATABASE_URL > $BACKUP_FILE

# Upload to cloud storage
aws s3 cp $BACKUP_FILE s3://coinbitclub-backups/

# Cleanup local file
rm $BACKUP_FILE

echo "✅ Backup completed: $BACKUP_FILE"
```

---

**🚀 Sistema deployed e configurado para máxima performance e confiabilidade!** ✨
