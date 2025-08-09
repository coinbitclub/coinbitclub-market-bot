#!/usr/bin/env node

/**
 * PRÉ-PUSH SECURITY FIX SYSTEM
 * 
 * Sistema para identificar e corrigir exposições de credenciais antes do deploy
 * Remove hardcoded credentials e garante uso de variáveis de ambiente
 * 
 * CRITICAL: Execute antes de qualquer push para produção
 */

const fs = require('fs');
const path = require('path');

class SecurityFixer {
    constructor() {
        this.backupDir = path.join(__dirname, 'security-backup');
        this.exposedFiles = [];
        this.fixedFiles = [];
        this.errors = [];
        
        // Padrões de credenciais expostas
        this.sensitivePatterns = [
            {
                name: 'Hardcoded Database Password',
                pattern: /ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq/g,
                replacement: 'PROTECTED_DB_PASSWORD'
            },
            {
                name: 'Full Database URL',
                pattern: /postgresql:\/\/postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley\.proxy\.rlwy\.net:44790\/railway/g,
                replacement: "process.env.DATABASE_URL || 'DATABASE_URL_NOT_SET'"
            },
            {
                name: 'Direct DB Connection Object',
                pattern: /password:\s*['"]ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq['"]/, 
                replacement: "password: process.env.DB_PASSWORD || 'DB_PASSWORD_NOT_SET'"
            },
            {
                name: 'OpenAI API Key',
                pattern: /sk-proj-[A-Za-z0-9\-_]+/g,
                replacement: "process.env.OPENAI_API_KEY || 'OPENAI_API_KEY_NOT_SET'"
            }
        ];

        // Arquivos críticos para correção
        this.criticalFiles = [
            'enhanced-signal-processor-with-execution.js',
            'dashboard-real-final.js',
            'dashboard-tempo-real.js',
            'database-migration.js',
            'diagnostico-completo-sinais.js',
            'diagnostico-sinais-tradingview.js',
            'diagnostico-tabelas-dashboard.js',
            'diagnostico-dependencias-banco.js',
            'diagnostico-completo.js',
            'diagnostico-completo-sistema.js',
            'detailed-signal-tracker.js',
            'data-cleanup-service.js'
        ];
    }

    async run() {
        console.log('🚨 INICIANDO AUDITORIA DE SEGURANÇA PRÉ-PUSH...\n');
        
        try {
            // 1. Criar backup
            await this.createBackup();
            
            // 2. Escanear arquivos
            await this.scanForExposures();
            
            // 3. Corrigir exposições
            await this.fixExposures();
            
            // 4. Validar .gitignore
            await this.validateGitIgnore();
            
            // 5. Verificar arquivos .env
            await this.checkEnvFiles();
            
            // 6. Relatório final
            this.generateReport();
            
        } catch (error) {
            console.error('❌ ERRO CRÍTICO:', error.message);
            process.exit(1);
        }
    }

    async createBackup() {
        console.log('📦 Criando backup de segurança...');
        
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.backupDir, `backup-${timestamp}`);
        fs.mkdirSync(backupPath, { recursive: true });

        for (const file of this.criticalFiles) {
            const sourcePath = path.join(__dirname, file);
            if (fs.existsSync(sourcePath)) {
                const destPath = path.join(backupPath, file);
                fs.copyFileSync(sourcePath, destPath);
            }
        }

        console.log(`✅ Backup criado em: ${backupPath}\n`);
    }

    async scanForExposures() {
        console.log('🔍 Escaneando exposições de credenciais...');
        
        for (const file of this.criticalFiles) {
            const filePath = path.join(__dirname, file);
            
            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  Arquivo não encontrado: ${file}`);
                continue;
            }

            const content = fs.readFileSync(filePath, 'utf8');
            let hasExposure = false;

            for (const pattern of this.sensitivePatterns) {
                if (pattern.pattern.test(content)) {
                    hasExposure = true;
                    break;
                }
            }

            if (hasExposure) {
                this.exposedFiles.push(file);
                console.log(`🚨 EXPOSIÇÃO ENCONTRADA: ${file}`);
            }
        }

        console.log(`\n📊 Total de arquivos com exposições: ${this.exposedFiles.length}\n`);
    }

    async fixExposures() {
        console.log('🔧 Corrigindo exposições de credenciais...');
        
        for (const file of this.exposedFiles) {
            const filePath = path.join(__dirname, file);
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;

            console.log(`\n🔧 Processando: ${file}`);

            for (const pattern of this.sensitivePatterns) {
                const matches = content.match(pattern.pattern);
                if (matches) {
                    console.log(`  ↳ Corrigindo: ${pattern.name} (${matches.length} ocorrências)`);
                    content = content.replace(pattern.pattern, pattern.replacement);
                    modified = true;
                }
            }

            if (modified) {
                // Adicionar header de segurança se não existir
                if (!content.includes('SECURITY_VALIDATED')) {
                    const header = `// SECURITY_VALIDATED: ${new Date().toISOString()}\n// Este arquivo foi verificado e tem credenciais protegidas\n\n`;
                    content = header + content;
                }

                fs.writeFileSync(filePath, content, 'utf8');
                this.fixedFiles.push(file);
                console.log(`  ✅ ${file} corrigido`);
            }
        }

        console.log(`\n📊 Total de arquivos corrigidos: ${this.fixedFiles.length}\n`);
    }

    async validateGitIgnore() {
        console.log('📝 Validando .gitignore...');
        
        const gitignorePath = path.join(__dirname, '.gitignore');
        let gitignoreContent = '';

        if (fs.existsSync(gitignorePath)) {
            gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        }

        const requiredEntries = [
            '# Environment files',
            '.env',
            '.env.local',
            '.env.development',
            '.env.production',
            '.env.test',
            '.env.secure',
            '',
            '# Logs',
            'logs',
            '*.log',
            'npm-debug.log*',
            '',
            '# Dependencies',
            'node_modules/',
            '',
            '# Security',
            'security-backup/',
            '*.key',
            '*.pem',
            '',
            '# OS generated files',
            '.DS_Store',
            'Thumbs.db'
        ];

        let needsUpdate = false;
        const missingEntries = [];

        for (const entry of requiredEntries) {
            if (!gitignoreContent.includes(entry)) {
                missingEntries.push(entry);
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            const newContent = gitignoreContent + '\n' + missingEntries.join('\n') + '\n';
            fs.writeFileSync(gitignorePath, newContent, 'utf8');
            console.log('✅ .gitignore atualizado com entradas de segurança');
        } else {
            console.log('✅ .gitignore já está configurado corretamente');
        }
    }

    async checkEnvFiles() {
        console.log('\n📋 Verificando arquivos .env...');
        
        const envFiles = [
            '.env',
            '.env.production',
            '.env.test',
            '.env.secure'
        ];

        const envStatus = [];

        for (const envFile of envFiles) {
            const envPath = path.join(__dirname, envFile);
            
            if (fs.existsSync(envPath)) {
                const content = fs.readFileSync(envPath, 'utf8');
                
                const status = {
                    file: envFile,
                    exists: true,
                    hasSensitiveData: false,
                    issues: []
                };

                // Verificar se contém dados sensíveis
                for (const pattern of this.sensitivePatterns) {
                    if (pattern.pattern.test(content)) {
                        status.hasSensitiveData = true;
                        status.issues.push(pattern.name);
                    }
                }

                envStatus.push(status);
                
                if (status.hasSensitiveData) {
                    console.log(`⚠️  ${envFile}: Contém dados sensíveis - ${status.issues.join(', ')}`);
                } else {
                    console.log(`✅ ${envFile}: Seguro`);
                }
            }
        }

        // Verificar se existe .env.example
        const examplePath = path.join(__dirname, '.env.example');
        if (!fs.existsSync(examplePath)) {
            console.log('⚠️  .env.example não encontrado - recomendado criar');
        }
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📋 RELATÓRIO DE SEGURANÇA PRÉ-PUSH');
        console.log('='.repeat(60));
        
        console.log(`\n🔍 ARQUIVOS ESCANEADOS: ${this.criticalFiles.length}`);
        console.log(`🚨 EXPOSIÇÕES ENCONTRADAS: ${this.exposedFiles.length}`);
        console.log(`🔧 ARQUIVOS CORRIGIDOS: ${this.fixedFiles.length}`);
        console.log(`❌ ERROS: ${this.errors.length}`);

        if (this.exposedFiles.length > 0) {
            console.log('\n📁 ARQUIVOS COM EXPOSIÇÕES CORRIGIDAS:');
            this.exposedFiles.forEach(file => {
                const status = this.fixedFiles.includes(file) ? '✅' : '❌';
                console.log(`  ${status} ${file}`);
            });
        }

        if (this.errors.length > 0) {
            console.log('\n❌ ERROS ENCONTRADOS:');
            this.errors.forEach(error => console.log(`  • ${error}`));
        }

        // Status do push
        const canPush = this.fixedFiles.length === this.exposedFiles.length && this.errors.length === 0;
        
        console.log('\n' + '='.repeat(60));
        if (canPush) {
            console.log('✅ SISTEMA SEGURO PARA PUSH');
            console.log('✅ Todas as exposições foram corrigidas');
            console.log('✅ Backup criado com sucesso');
            console.log('✅ .gitignore configurado');
        } else {
            console.log('❌ SISTEMA NÃO ESTÁ SEGURO PARA PUSH');
            console.log('❌ Existem exposições não corrigidas');
            console.log('❌ RESOLVA OS PROBLEMAS ANTES DO DEPLOY');
        }
        console.log('='.repeat(60));

        // Instruções para o Railway
        console.log('\n🚀 INSTRUÇÕES PARA RAILWAY:');
        console.log('1. Configure as seguintes variáveis de ambiente no Railway:');
        console.log('   • DATABASE_URL (já configurada)');
        console.log('   • DB_PASSWORD');
        console.log('   • OPENAI_API_KEY');
        console.log('   • BINANCE_API_KEY (se necessário)');
        console.log('   • BINANCE_API_SECRET (se necessário)');
        console.log('   • BYBIT_API_KEY (se necessário)');
        console.log('   • BYBIT_API_SECRET (se necessário)');
        console.log('\n2. Remova os arquivos .env* do controle de versão');
        console.log('3. Execute o push com segurança');

        return canPush;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const fixer = new SecurityFixer();
    fixer.run().then(() => {
        const canPush = fixer.fixedFiles.length === fixer.exposedFiles.length && fixer.errors.length === 0;
        process.exit(canPush ? 0 : 1);
    }).catch(error => {
        console.error('❌ ERRO FATAL:', error);
        process.exit(1);
    });
}

module.exports = SecurityFixer;
