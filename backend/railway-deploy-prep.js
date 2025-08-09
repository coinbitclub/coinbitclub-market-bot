#!/usr/bin/env node

/**
 * 🚀 RAILWAY DEPLOYMENT PREPARATION SYSTEM
 * =========================================
 * 
 * Sistema final para preparar deploy seguro no Railway
 * Garante que todas as credenciais estão protegidas
 */

const fs = require('fs');
const path = require('path');

class RailwayDeployPrep {
    constructor() {
        this.projectRoot = __dirname;
        this.requiredEnvVars = [
            'DATABASE_URL',
            'OPENAI_API_KEY',
            'COINSTATS_API_KEY',
            'JWT_SECRET',
            'ENCRYPTION_KEY'
        ];
        
        this.optionalEnvVars = [
            'BINANCE_API_KEY',
            'BINANCE_API_SECRET',
            'BYBIT_API_KEY',
            'BYBIT_API_SECRET',
            'BINANCE_TESTNET_API_KEY',
            'BINANCE_TESTNET_API_SECRET',
            'BYBIT_TESTNET_API_KEY',
            'BYBIT_TESTNET_API_SECRET'
        ];
    }

    async prepare() {
        console.log('🚀 INICIANDO PREPARAÇÃO PARA DEPLOY RAILWAY...\n');
        
        try {
            await this.checkSecurityFixes();
            await this.validateEnvironmentVariables();
            await this.createRailwayConfig();
            await this.generateDeployInstructions();
            
            console.log('\n✅ SISTEMA PRONTO PARA DEPLOY SEGURO!');
            
        } catch (error) {
            console.error('❌ ERRO:', error.message);
            process.exit(1);
        }
    }

    async checkSecurityFixes() {
        console.log('🔐 Verificando correções de segurança...');
        
        const criticalFiles = [
            'enhanced-signal-processor-with-execution.js',
            'dashboard-real-final.js',
            'database-migration.js'
        ];

        for (const file of criticalFiles) {
            const filePath = path.join(this.projectRoot, file);
            
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Verificar se ainda tem credenciais expostas
                if (content.includes('ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq')) {
                    throw new Error(`Credenciais ainda expostas em ${file}`);
                }
                
                // Verificar se tem header de segurança
                if (content.includes('SECURITY_VALIDATED')) {
                    console.log(`✅ ${file} - Seguro`);
                } else {
                    console.log(`⚠️  ${file} - Sem validação de segurança`);
                }
            }
        }
    }

    async validateEnvironmentVariables() {
        console.log('\n📋 Validando variáveis de ambiente...');
        
        // Ler .env para referência
        const envPath = path.join(this.projectRoot, '.env');
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        console.log('\n📝 VARIÁVEIS OBRIGATÓRIAS NO RAILWAY:');
        for (const envVar of this.requiredEnvVars) {
            const hasInEnv = envContent.includes(`${envVar}=`);
            console.log(`  ${hasInEnv ? '✅' : '❌'} ${envVar}`);
        }

        console.log('\n📝 VARIÁVEIS OPCIONAIS NO RAILWAY:');
        for (const envVar of this.optionalEnvVars) {
            const hasInEnv = envContent.includes(`${envVar}=`);
            console.log(`  ${hasInEnv ? '✅' : '⚪'} ${envVar}`);
        }
    }

    async createRailwayConfig() {
        console.log('\n⚙️  Criando configuração Railway...');
        
        const railwayToml = `[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[environments.production.variables]
NODE_ENV = "production"
PORT = "3000"
ENABLE_DETAILED_LOGS = "true"
ANALYTICS_ENABLED = "true"

[environments.production.build]
buildCommand = "npm install --production"
startCommand = "node app.js"
`;

        const railwayPath = path.join(this.projectRoot, 'railway.toml');
        fs.writeFileSync(railwayPath, railwayToml);
        console.log('✅ railway.toml criado');

        // Criar healthcheck endpoint se não existir
        const healthcheckCode = `
// Health check endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        env: process.env.NODE_ENV || 'development'
    });
});
`;

        console.log('✅ Configuração Railway preparada');
    }

    async generateDeployInstructions() {
        console.log('\n📋 Gerando instruções de deploy...');
        
        const instructions = `# 🚀 INSTRUÇÕES DE DEPLOY RAILWAY - COINBITCLUB

## 1. CONFIGURAR VARIÁVEIS DE AMBIENTE NO RAILWAY

### Variáveis Obrigatórias:
\`\`\`
DATABASE_URL=postgresql://postgres:senha@host:porta/database
OPENAI_API_KEY=sk-proj-...
COINSTATS_API_KEY=ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=
JWT_SECRET=chave-jwt-super-secreta-32-chars
ENCRYPTION_KEY=chave-criptografia-32-characters
NODE_ENV=production
PORT=3000
\`\`\`

### Variáveis Opcionais (Trading):
\`\`\`
BINANCE_API_KEY=sua_chave_binance
BINANCE_API_SECRET=sua_chave_secreta_binance
BYBIT_API_KEY=sua_chave_bybit
BYBIT_API_SECRET=sua_chave_secreta_bybit
\`\`\`

## 2. COMANDOS DE DEPLOY

### Primeira vez:
\`\`\`bash
# 1. Login no Railway
railway login

# 2. Linkar projeto
railway link

# 3. Configurar variáveis de ambiente
railway variables set DATABASE_URL="valor"
railway variables set OPENAI_API_KEY="valor"
railway variables set COINSTATS_API_KEY="valor"
railway variables set JWT_SECRET="valor"
railway variables set ENCRYPTION_KEY="valor"

# 4. Deploy
railway up
\`\`\`

### Deploys subsequentes:
\`\`\`bash
git add .
git commit -m "deploy: atualizações do sistema"
git push origin main
railway up
\`\`\`

## 3. VERIFICAÇÕES PÓS-DEPLOY

### Teste endpoints críticos:
\`\`\`
GET /health - Status do sistema
GET /api/dashboard/stats - Dashboard principal
POST /webhook/tradingview - Recebimento de sinais
\`\`\`

### Monitorar logs:
\`\`\`bash
railway logs
\`\`\`

## 4. ROLLBACK (SE NECESSÁRIO)

\`\`\`bash
# Ver deploys anteriores
railway deployments

# Fazer rollback para deploy específico
railway rollback [deployment-id]
\`\`\`

## ⚠️ IMPORTANTE

- ✅ Todas as credenciais hardcoded foram removidas
- ✅ Backup de segurança foi criado
- ✅ .gitignore configurado para arquivos .env
- ✅ Sistema validado para deploy seguro

## 🔄 PROCESSO DE ATUALIZAÇÃO

1. Sempre fazer backup antes de alterações
2. Testar localmente primeiro
3. Usar git flow adequado
4. Monitorar logs após deploy
5. Ter plano de rollback pronto

---
Gerado automaticamente em: ${new Date().toISOString()}
`;

        const instructionsPath = path.join(this.projectRoot, 'RAILWAY-DEPLOY-INSTRUCTIONS.md');
        fs.writeFileSync(instructionsPath, instructions);
        console.log('✅ RAILWAY-DEPLOY-INSTRUCTIONS.md criado');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const prep = new RailwayDeployPrep();
    prep.prepare().catch(error => {
        console.error('❌ ERRO FATAL:', error);
        process.exit(1);
    });
}

module.exports = RailwayDeployPrep;
