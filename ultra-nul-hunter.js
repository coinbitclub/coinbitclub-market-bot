const fs = require('fs');
const path = require('path');

console.log('🚨 CAÇADOR ULTRA-AGRESSIVO DE NUL');
console.log('================================');

// Função para escanear TODOS os arquivos do projeto
function scanAllFiles(startDir) {
    const problematicFiles = [];
    
    function scanRecursive(currentPath, depth = 0) {
        if (depth > 10) return; // Evitar recursão infinita
        
        try {
            const items = fs.readdirSync(currentPath, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(currentPath, item.name);
                
                if (item.isDirectory()) {
                    // Pular apenas .git
                    if (item.name !== '.git') {
                        scanRecursive(fullPath, depth + 1);
                    }
                } else if (item.isFile()) {
                    // Verificar TODOS os tipos de arquivo
                    try {
                        const buffer = fs.readFileSync(fullPath);
                        const nullCount = buffer.filter(byte => byte === 0).length;
                        
                        if (nullCount > 0) {
                            problematicFiles.push({
                                path: fullPath,
                                relative: path.relative(startDir, fullPath),
                                nullCount: nullCount,
                                size: buffer.length
                            });
                        }
                    } catch (error) {
                        // Ignorar arquivos que não conseguimos ler
                    }
                }
            }
        } catch (error) {
            // Ignorar diretórios sem permissão
        }
    }
    
    scanRecursive(startDir);
    return problematicFiles;
}

// Função para limpar arquivo binário
function cleanFileBinary(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        const cleanBuffer = Buffer.from(buffer.filter(byte => byte !== 0));
        
        // Fazer backup
        const backupPath = filePath + '.ultra-backup-' + Date.now();
        fs.writeFileSync(backupPath, buffer);
        
        // Escrever arquivo limpo
        fs.writeFileSync(filePath, cleanBuffer);
        
        return true;
    } catch (error) {
        console.error(`Erro ao limpar ${filePath}: ${error.message}`);
        return false;
    }
}

// Função principal
async function ultraAggressiveHunt() {
    console.log('\n🔍 ESCANEANDO TODO O PROJETO (INCLUINDO node_modules)...');
    
    const rootDir = __dirname;
    const problematicFiles = scanAllFiles(rootDir);
    
    if (problematicFiles.length === 0) {
        console.log('✅ Nenhum arquivo com caracteres NUL encontrado!');
        return;
    }
    
    console.log(`\n❌ ENCONTRADOS ${problematicFiles.length} ARQUIVOS COM NUL:`);
    console.log('='.repeat(60));
    
    for (const file of problematicFiles) {
        console.log(`\n📄 ${file.relative}`);
        console.log(`   Tamanho: ${file.size} bytes`);
        console.log(`   Caracteres NUL: ${file.nullCount}`);
        
        // Decidir se devemos limpar
        const shouldClean = !file.relative.includes('node_modules') || 
                          file.relative.includes('package.json') ||
                          file.relative.includes('.js') ||
                          file.relative.includes('.json');
        
        if (shouldClean) {
            console.log(`   🔧 Limpando arquivo...`);
            if (cleanFileBinary(file.path)) {
                console.log(`   ✅ Arquivo limpo com sucesso!`);
            } else {
                console.log(`   ❌ Falha ao limpar arquivo`);
            }
        } else {
            console.log(`   ⏭️  Pulando (node_modules binário)`);
        }
    }
    
    // Verificar novamente
    console.log('\n🔄 SEGUNDA VERIFICAÇÃO...');
    const remainingFiles = scanAllFiles(rootDir);
    
    if (remainingFiles.length === 0) {
        console.log('🎉 TODOS OS CARACTERES NUL ELIMINADOS!');
    } else {
        console.log(`⚠️  Ainda restam ${remainingFiles.length} arquivos problemáticos`);
        
        // Mostrar apenas os críticos
        const criticalRemaining = remainingFiles.filter(f => 
            !f.relative.includes('node_modules') || 
            f.relative.includes('package.json')
        );
        
        if (criticalRemaining.length > 0) {
            console.log('\n❌ ARQUIVOS CRÍTICOS AINDA COM PROBLEMAS:');
            criticalRemaining.forEach(f => {
                console.log(`   - ${f.relative} (${f.nullCount} NULs)`);
            });
        }
    }
}

// Função para verificar input específico
function checkStdinAndConsole() {
    console.log('\n🔍 VERIFICANDO ENTRADA E CONSOLE...');
    
    // Verificar se há algo no stdin
    console.log('process.stdin.readable:', process.stdin.readable);
    console.log('process.stdin.readableLength:', process.stdin.readableLength);
    
    // Verificar variáveis de ambiente
    const suspiciousEnvVars = Object.keys(process.env).filter(key => {
        const value = process.env[key];
        return value && value.includes('\x00');
    });
    
    if (suspiciousEnvVars.length > 0) {
        console.log('❌ VARIÁVEIS DE AMBIENTE COM NUL:');
        suspiciousEnvVars.forEach(key => {
            console.log(`   ${key}:`, process.env[key].replace(/\x00/g, '[NUL]'));
        });
    } else {
        console.log('✅ Variáveis de ambiente limpas');
    }
}

// Executar tudo
Promise.resolve()
    .then(() => checkStdinAndConsole())
    .then(() => ultraAggressiveHunt())
    .catch(console.error);
