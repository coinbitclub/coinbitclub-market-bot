const fs = require('fs');
const path = require('path');

console.log('🔧 CORRETOR PRECISO DE ASPAS DUPLICADAS');
console.log('=======================================');

class PreciseQuoteFixer {
    constructor() {
        this.rootDir = __dirname;
        this.fixedFiles = [];
    }

    // Corrigir aspas duplicadas específicas
    fixDuplicateQuotes(content) {
        // Padrões específicos que o corretor anterior criou
        let fixed = content
            // Corrigir import statements com aspas duplas no final
            .replace(/(import.*from\s+['"][^'"]*['"];)'/g, '$1')
            // Corrigir strings com aspas duplas no final
            .replace(/(['"][^'"]*['"])'/g, '$1')
            // Corrigir declarações com aspas duplas
            .replace(/:\s*(['"][^'"]*['"])'/g, ': $1')
            // Corrigir condições com aspas duplas
            .replace(/\(\s*(['"][^'"]*['"])'/g, '($1')
            // Corrigir arrays e objetos
            .replace(/,\s*(['"][^'"]*['"])'/g, ', $1')
            // Padrão mais específico para o erro detectado
            .replace(/(['"])(['"])/g, '$1');

        return fixed;
    }

    // Corrigir arquivo específico
    async fixFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const fixed = this.fixDuplicateQuotes(content);
            
            if (content !== fixed) {
                // Fazer backup
                const backupPath = filePath + '.quote-fix-backup-' + Date.now();
                fs.writeFileSync(backupPath, content);
                
                // Aplicar correção
                fs.writeFileSync(filePath, fixed, 'utf8');
                
                this.fixedFiles.push({
                    file: path.relative(this.rootDir, filePath),
                    backup: path.relative(this.rootDir, backupPath)
                });
                
                console.log(`✅ Corrigido: ${path.relative(this.rootDir, filePath)}`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`❌ Erro ao corrigir ${filePath}: ${error.message}`);
            return false;
        }
    }

    // Encontrar arquivos problemáticos
    async findProblematicFiles() {
        const problematicFiles = [
            'coinbitclub-frontend-premium/pages/index.tsx',
            'coinbitclub-frontend-premium/pages/api/auth/redefinir-senha.ts',
            'coinbitclub-frontend-premium/src/pages/api/auth/redefinir-senha.ts',
            'coinbitclub-frontend-premium/src/lib/utils.ts',
            'coinbitclub-frontend-premium/src/utils/validation.ts',
            'coinbitclub-frontend-premium/src/pages/redefinir-senha.tsx'
        ];

        console.log('\n🔍 Corrigindo arquivos específicos...');
        
        for (const file of problematicFiles) {
            const fullPath = path.join(this.rootDir, file);
            if (fs.existsSync(fullPath)) {
                await this.fixFile(fullPath);
            }
        }
    }

    // Executar correção completa
    async run() {
        try {
            await this.findProblematicFiles();
            
            console.log('\n📊 RELATÓRIO DE CORREÇÃO:');
            console.log(`Arquivos corrigidos: ${this.fixedFiles.length}`);
            
            if (this.fixedFiles.length > 0) {
                console.log('\n✅ CORREÇÕES APLICADAS:');
                this.fixedFiles.forEach(fix => {
                    console.log(`   - ${fix.file} (backup: ${fix.backup})`);
                });
            }
            
        } catch (error) {
            console.error('❌ Erro durante execução:', error);
        }
    }
}

// Executar
const fixer = new PreciseQuoteFixer();
fixer.run();
