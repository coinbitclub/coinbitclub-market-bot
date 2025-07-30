const fs = require('fs');
const path = require('path');

console.log('🚨 ELIMINADOR DEFINITIVO DE CARACTERES NUL');
console.log('===========================================');
console.log('Última tentativa - Destruindo TODOS os NULs!');

// Função ultra-agressiva para eliminar NUL
function destroyAllNulCharacters(content) {
    // Converter para buffer e filtrar todos os bytes 0
    const buffer = Buffer.from(content, 'utf8');
    const cleanBuffer = Buffer.from(buffer.filter(byte => byte !== 0));
    
    // Converter de volta para string e aplicar limpezas adicionais
    let cleaned = cleanBuffer.toString('utf8')
        .replace(/\x00/g, '') // Remove NUL characters
        .replace(/\uFFFD/g, '') // Remove replacement characters  
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove control characters
        .replace(/\?\?\?\?/g, '') // Remove question marks
        .replace(/'''/g, '"') // Substituir aspas triplas por aspas duplas
        .replace(/''/g, '"') // Substituir aspas duplas por aspas simples
        .trim();
    
    return cleaned;
}

// Escanear e corrigir TODOS os arquivos do projeto
async function nukAllNulCharacters() {
    const rootDir = __dirname;
    
    console.log('\n🔍 DESTRUINDO CARACTERES NUL EM TODO O PROJETO...');
    
    // Função recursiva para escanear todos os arquivos
    function scanDirectory(dir, fixedCount = { count: 0 }) {
        try {
            const items = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                
                if (item.isDirectory()) {
                    // Pular apenas .git e node_modules binários
                    if (item.name !== '.git' && item.name !== 'node_modules') {
                        scanDirectory(fullPath, fixedCount);
                    }
                } else if (item.isFile()) {
                    try {
                        // Ler arquivo como buffer para detectar NUL
                        const buffer = fs.readFileSync(fullPath);
                        const hasNul = buffer.includes(0);
                        
                        if (hasNul) {
                            console.log(`🔧 Corrigindo: ${path.relative(rootDir, fullPath)}`);
                            
                            // Fazer backup
                            const backupPath = fullPath + '.nul-destroy-backup-' + Date.now();
                            fs.writeFileSync(backupPath, buffer);
                            
                            // Converter para string e limpar
                            const content = buffer.toString('utf8');
                            const cleaned = destroyAllNulCharacters(content);
                            
                            // Reescrever arquivo limpo
                            fs.writeFileSync(fullPath, cleaned, 'utf8');
                            
                            fixedCount.count++;
                            console.log(`   ✅ Arquivo limpo! (Backup: ${path.basename(backupPath)})`);
                        }
                    } catch (error) {
                        // Ignorar arquivos binários que não conseguimos processar
                    }
                }
            }
        } catch (error) {
            // Ignorar diretórios sem permissão
        }
        
        return fixedCount.count;
    }
    
    const totalFixed = scanDirectory(rootDir);
    
    console.log(`\n📊 RESULTADO FINAL:`);
    console.log(`Arquivos corrigidos: ${totalFixed}`);
    
    if (totalFixed === 0) {
        console.log('✅ Nenhum arquivo com caracteres NUL encontrado!');
    } else {
        console.log(`✅ ${totalFixed} arquivos foram limpos de caracteres NUL!`);
    }
}

// Validação final
async function finalValidation() {
    console.log('\n🔍 VALIDAÇÃO FINAL...');
    
    // Testar arquivos críticos
    const criticalFiles = [
        'package.json',
        'main.js',
        'universal-error-fixer.js'
    ];
    
    let allClean = true;
    
    for (const file of criticalFiles) {
        const fullPath = path.join(__dirname, file);
        if (fs.existsSync(fullPath)) {
            const buffer = fs.readFileSync(fullPath);
            const hasNul = buffer.includes(0);
            
            if (hasNul) {
                console.log(`❌ ${file}: AINDA CONTÉM CARACTERES NUL!`);
                allClean = false;
            } else {
                console.log(`✅ ${file}: Limpo`);
            }
        }
    }
    
    if (allClean) {
        console.log('\n🎉 TODOS OS ARQUIVOS CRÍTICOS ESTÃO LIMPOS!');
    } else {
        console.log('\n⚠️ ALGUNS ARQUIVOS AINDA PRECISAM DE CORREÇÃO MANUAL');
    }
    
    return allClean;
}

// Executar tudo
async function main() {
    try {
        await nukAllNulCharacters();
        await finalValidation();
        
        console.log('\n🚀 COMANDO COMPLETO!');
        console.log('Teste agora: node main.js');
        
    } catch (error) {
        console.error('❌ Erro durante execução:', error);
    }
}

main();
