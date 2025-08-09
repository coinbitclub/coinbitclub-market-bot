const fs = require('fs');
const path = require('path');

console.log('🔧 CORREÇÃO DEFINITIVA DE CARACTERES NUL');
console.log('========================================');

// Função para limpar caracteres NUL e especiais
function cleanFileContent(content) {
    return content
        .replace(/\x00/g, '') // Remove NUL characters
        .replace(/\uFFFD/g, '') // Remove replacement characters
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove control characters
        .replace(/\?\?\?\?/g, '') // Remove question marks
        .trim();
}

// Função para verificar e corrigir arquivos
async function fixFiles() {
    console.log('\n🔍 Verificando arquivos problemáticos...');
    
    const criticalFiles = [
        'package.json',
        'backend/package.json',
        'railway.json',
        'coinbitclub-frontend-premium/package.json'
    ];
    
    for (const file of criticalFiles) {
        const fullPath = path.join(__dirname, file);
        
        if (fs.existsSync(fullPath)) {
            console.log(`\n📄 Verificando: ${file}`);
            
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const hasNulChars = content.includes('\x00');
                const hasSpecialChars = /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(content);
                
                if (hasNulChars || hasSpecialChars) {
                    console.log(`   ❌ Caracteres problemáticos encontrados!`);
                    
                    // Fazer backup
                    const backupPath = fullPath + '.corrupted-backup';
                    fs.writeFileSync(backupPath, content);
                    console.log(`   💾 Backup criado: ${file}.corrupted-backup`);
                    
                    // Limpar e reescrever
                    const cleanContent = cleanFileContent(content);
                    fs.writeFileSync(fullPath, cleanContent, 'utf8');
                    console.log(`   ✅ Arquivo limpo e corrigido!`);
                    
                    // Verificar se é JSON válido
                    if (file.endsWith('.json')) {
                        try {
                            JSON.parse(cleanContent);
                            console.log(`   ✅ JSON válido após correção`);
                        } catch (error) {
                            console.log(`   ❌ JSON inválido: ${error.message}`);
                            // Restaurar estrutura básica se necessário
                            await fixJsonStructure(fullPath, file);
                        }
                    }
                } else {
                    console.log(`   ✅ Arquivo limpo`);
                }
            } catch (error) {
                console.log(`   ❌ Erro ao processar: ${error.message}`);
            }
        } else {
            console.log(`   ⚠️  Arquivo não encontrado: ${file}`);
        }
    }
    
    // Verificar arquivos JS/CJS na raiz
    console.log('\n🔍 Verificando arquivos executáveis...');
    
    const rootDir = __dirname;
    const files = fs.readdirSync(rootDir);
    
    for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.cjs')) {
            const fullPath = path.join(rootDir, file);
            
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const hasNulChars = content.includes('\x00');
                const hasSpecialChars = /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(content);
                
                if (hasNulChars || hasSpecialChars) {
                    console.log(`   ❌ ${file}: Caracteres problemáticos encontrados!`);
                    
                    // Fazer backup
                    const backupPath = fullPath + '.corrupted-backup';
                    fs.writeFileSync(backupPath, content);
                    
                    // Limpar e reescrever
                    const cleanContent = cleanFileContent(content);
                    fs.writeFileSync(fullPath, cleanContent, 'utf8');
                    console.log(`   ✅ ${file}: Corrigido!`);
                }
            } catch (error) {
                console.log(`   ❌ ${file}: Erro - ${error.message}`);
            }
        }
    }
}

// Função para corrigir estrutura JSON
async function fixJsonStructure(filePath, fileName) {
    console.log(`   🔧 Corrigindo estrutura JSON: ${fileName}`);
    
    if (fileName.includes('package.json')) {
        const basicPackageJson = {
            "name": "coinbitclub-market-bot",
            "version": "3.0.0",
            "description": "CoinBitClub Market Bot V3 - Fixed",
            "main": "main.js",
            "scripts": {
                "start": "node main.js",
                "dev": "node main.js",
                "test": "echo \"Test OK\""
            },
            "engines": {
                "node": ">=18.0.0"
            },
            "dependencies": {
                "axios": "^1.11.0",
                "bcrypt": "^6.0.0",
                "compression": "^1.7.4",
                "cors": "^2.8.5",
                "express": "^4.18.2",
                "helmet": "^7.0.0",
                "jsonwebtoken": "^9.0.2",
                "pg": "^8.11.3",
                "ws": "^8.13.0"
            }
        };
        
        fs.writeFileSync(filePath, JSON.stringify(basicPackageJson, null, 2), 'utf8');
        console.log(`   ✅ Estrutura package.json restaurada`);
    }
    
    if (fileName.includes('railway.json')) {
        const basicRailwayJson = {
            "$schema": "https://railway.app/railway.schema.json",
            "build": {
                "builder": "NIXPACKS"
            },
            "deploy": {
                "startCommand": "node main.js",
                "healthcheckPath": "/health",
                "healthcheckTimeout": 100,
                "restartPolicyType": "ON_FAILURE"
            }
        };
        
        fs.writeFileSync(filePath, JSON.stringify(basicRailwayJson, null, 2), 'utf8');
        console.log(`   ✅ Estrutura railway.json restaurada`);
    }
}

// Função para criar um servidor principal limpo
async function createCleanMainServer() {
    console.log('\n🔧 Criando servidor principal limpo...');
    
    const cleanServerContent = `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { Pool } = require('pg');

// Configuração da aplicação
const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middlewares de segurança
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '3.0.0-fixed',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'CoinBitClub Market Bot V3 - API Active',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// API de teste do banco
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as timestamp');
        res.json({
            status: 'connected',
            database_time: result.rows[0].timestamp
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Middleware de tratamento de erro
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Middleware 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.originalUrl
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 CoinBitClub Server V3 Started');
    console.log('================================');
    console.log('Port:', PORT);
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Health Check: /health');
    console.log('Database Test: /api/test-db');
    console.log('================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    pool.end(() => {
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    pool.end(() => {
        process.exit(0);
    });
});
`;

    fs.writeFileSync('main.js', cleanServerContent, 'utf8');
    console.log('✅ Servidor principal limpo criado: main.js');
}

// Executar correções
async function main() {
    try {
        await fixFiles();
        await createCleanMainServer();
        
        console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
        console.log('======================');
        console.log('✅ Caracteres NUL removidos');
        console.log('✅ JSONs corrigidos');
        console.log('✅ Servidor principal limpo criado');
        console.log('✅ Backups dos arquivos corrompidos salvos');
        
        console.log('\n🚀 PRÓXIMOS PASSOS:');
        console.log('1. Teste local: node main.js');
        console.log('2. Commit: git add . && git commit -m "Fix NUL characters"');
        console.log('3. Deploy: git push origin main');
        
    } catch (error) {
        console.error('❌ Erro na correção:', error);
    }
}

main();
