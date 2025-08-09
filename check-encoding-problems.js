const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICAÇÃO EXAUSTIVA - FRONTEND PROBLEMAS');
console.log('==============================================');

// Função para detectar problemas comuns de encoding
function detectEncodingProblems(content, filePath) {
    const problems = [];
    
    // Verificar caracteres NUL
    if (content.includes('\x00')) {
        problems.push('NUL characters found');
    }
    
    // Verificar caracteres de substituição Unicode
    if (content.includes('\uFFFD')) {
        problems.push('Unicode replacement characters found');
    }
    
    // Verificar BOM (Byte Order Mark)
    if (content.charCodeAt(0) === 0xFEFF) {
        problems.push('BOM detected');
    }
    
    // Verificar caracteres de controle
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(content)) {
        problems.push('Control characters found');
    }
    
    // Verificar inconsistências de quebra de linha
    const crlfCount = (content.match(/\r\n/g) || []).length;
    const lfCount = (content.match(/(?<!\r)\n/g) || []).length;
    const crCount = (content.match(/\r(?!\n)/g) || []).length;
    
    if (crlfCount > 0 && lfCount > 0) {
        problems.push('Mixed line endings (CRLF and LF)');
    }
    
    if (crCount > 0) {
        problems.push('Mac classic line endings (CR)');
    }
    
    // Para arquivos TSX/JSX, verificar problemas específicos
    if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
        // Verificar imports problemáticos
        if (/import.*['"].*\0.*['"]/.test(content)) {
            problems.push('NUL in import statements');
        }
        
        // Verificar JSX malformado
        if (/<[^>]*\0[^>]*>/.test(content)) {
            problems.push('NUL in JSX tags');
        }
        
        // Verificar strings literais com problemas
        if (/['"`].*\0.*['"`]/.test(content)) {
            problems.push('NUL in string literals');
        }
    }
    
    // Para arquivos JSON
    if (filePath.endsWith('.json')) {
        try {
            JSON.parse(content);
        } catch (error) {
            problems.push(`Invalid JSON: ${error.message}`);
        }
    }
    
    return problems;
}

// Função para escanear diretório recursivamente
function scanDirectory(dirPath, filePattern = /\.(tsx?|jsx?|json|md)$/) {
    const results = [];
    
    function scanRecursive(currentPath) {
        try {
            const items = fs.readdirSync(currentPath, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(currentPath, item.name);
                
                if (item.isDirectory()) {
                    // Pular node_modules e .git
                    if (!item.name.match(/^(node_modules|\.git|\.next|build|dist)$/)) {
                        scanRecursive(fullPath);
                    }
                } else if (item.isFile() && filePattern.test(item.name)) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        const problems = detectEncodingProblems(content, fullPath);
                        
                        if (problems.length > 0) {
                            results.push({
                                file: path.relative(process.cwd(), fullPath),
                                problems: problems,
                                size: content.length,
                                lines: content.split('\n').length
                            });
                        }
                    } catch (error) {
                        results.push({
                            file: path.relative(process.cwd(), fullPath),
                            problems: [`Read error: ${error.message}`],
                            size: 0,
                            lines: 0
                        });
                    }
                }
            }
        } catch (error) {
            console.error(`Error scanning ${currentPath}: ${error.message}`);
        }
    }
    
    scanRecursive(dirPath);
    return results;
}

// Função para corrigir problemas automaticamente
function fixFileProblems(filePath, content) {
    let fixed = content;
    
    // Remove BOM
    if (fixed.charCodeAt(0) === 0xFEFF) {
        fixed = fixed.slice(1);
    }
    
    // Remove caracteres NUL e de controle
    fixed = fixed.replace(/\x00/g, '');
    fixed = fixed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    
    // Remove caracteres de substituição Unicode
    fixed = fixed.replace(/\uFFFD/g, '');
    
    // Normalizar quebras de linha para LF
    fixed = fixed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Para arquivos JSON, tentar reparar estrutura básica
    if (filePath.endsWith('.json')) {
        try {
            const parsed = JSON.parse(fixed);
            fixed = JSON.stringify(parsed, null, 2);
        } catch (error) {
            console.log(`   ⚠️ Cannot auto-fix JSON: ${error.message}`);
        }
    }
    
    return fixed;
}

// Função principal
async function checkFrontendProblems() {
    console.log('\n📁 Escaneando frontend...');
    
    const frontendPath = path.join(process.cwd(), 'coinbitclub-frontend-premium');
    
    if (!fs.existsSync(frontendPath)) {
        console.log('❌ Diretório frontend não encontrado');
        return;
    }
    
    const problems = scanDirectory(frontendPath);
    
    console.log(`\n📊 RESULTADO DO ESCANEAMENTO:`);
    console.log(`   Total de arquivos verificados: ${problems.length}`);
    
    if (problems.length === 0) {
        console.log('   ✅ Nenhum problema de encoding encontrado!');
        return;
    }
    
    console.log(`\n❌ PROBLEMAS ENCONTRADOS:`);
    console.log('========================');
    
    let fixedCount = 0;
    
    for (const problem of problems) {
        console.log(`\n📄 ${problem.file}`);
        console.log(`   📏 Tamanho: ${problem.size} bytes, ${problem.lines} linhas`);
        console.log(`   ❌ Problemas:`);
        
        for (const issue of problem.problems) {
            console.log(`      - ${issue}`);
        }
        
        // Tentar corrigir automaticamente
        if (!problem.problems.some(p => p.includes('Read error'))) {
            try {
                const fullPath = path.resolve(problem.file);
                const originalContent = fs.readFileSync(fullPath, 'utf8');
                const fixedContent = fixFileProblems(fullPath, originalContent);
                
                if (fixedContent !== originalContent) {
                    // Fazer backup
                    const backupPath = fullPath + '.encoding-backup';
                    fs.writeFileSync(backupPath, originalContent);
                    
                    // Aplicar correção
                    fs.writeFileSync(fullPath, fixedContent, 'utf8');
                    
                    console.log(`   ✅ Corrigido automaticamente (backup: ${path.basename(backupPath)})`);
                    fixedCount++;
                } else {
                    console.log(`   ℹ️ Nenhuma correção automática aplicável`);
                }
            } catch (error) {
                console.log(`   ❌ Erro ao corrigir: ${error.message}`);
            }
        }
    }
    
    console.log(`\n📊 RESUMO:`);
    console.log(`   Arquivos com problemas: ${problems.length}`);
    console.log(`   Arquivos corrigidos: ${fixedCount}`);
    console.log(`   Backups criados: ${fixedCount}`);
    
    if (fixedCount > 0) {
        console.log(`\n🔄 PRÓXIMOS PASSOS:`);
        console.log(`   1. Teste o frontend: cd coinbitclub-frontend-premium && npm run build`);
        console.log(`   2. Se funcionou, remova os backups: find . -name "*.encoding-backup" -delete`);
        console.log(`   3. Commit as correções: git add . && git commit -m "Fix encoding issues"`);
    }
}

// Verificar também arquivos na raiz específicos
async function checkRootProblems() {
    console.log('\n📁 Escaneando raiz do projeto...');
    
    const rootProblems = scanDirectory(process.cwd(), /\.(js|cjs|json|md|txt)$/);
    
    if (rootProblems.length > 0) {
        console.log(`\n❌ PROBLEMAS NA RAIZ:`);
        console.log('====================');
        
        for (const problem of rootProblems) {
            console.log(`\n📄 ${problem.file}`);
            for (const issue of problem.problems) {
                console.log(`   ❌ ${issue}`);
            }
        }
    } else {
        console.log('   ✅ Nenhum problema na raiz');
    }
}

// Executar verificações
async function main() {
    try {
        await checkRootProblems();
        await checkFrontendProblems();
        
        console.log('\n🎯 VERIFICAÇÃO CONCLUÍDA!');
        console.log('=========================');
        
    } catch (error) {
        console.error('❌ Erro durante verificação:', error);
    }
}

main();
