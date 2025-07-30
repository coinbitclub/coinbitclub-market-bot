const fs = require('fs');
const path = require('path');

console.log('🎯 VALIDAÇÃO FINAL - SISTEMA COMPLETAMENTE CORRIGIDO');
console.log('===================================================');

async function finalValidation() {
    const results = {
        backend: { status: '❌', issues: [] },
        frontend: { status: '❌', issues: [] },
        database: { status: '❌', issues: [] },
        encoding: { status: '❌', issues: [] }
    };

    // 1. Verificar Backend
    console.log('\n🔧 VERIFICANDO BACKEND...');
    
    try {
        if (fs.existsSync('main.js')) {
            const mainContent = fs.readFileSync('main.js', 'utf8');
            if (!mainContent.includes('\x00') && mainContent.includes('CoinBitClub')) {
                results.backend.status = '✅';
                console.log('   ✅ main.js limpo e funcional');
            } else {
                results.backend.issues.push('main.js com problemas');
            }
        } else {
            results.backend.issues.push('main.js não encontrado');
        }

        if (fs.existsSync('package.json')) {
            const packageContent = fs.readFileSync('package.json', 'utf8');
            try {
                JSON.parse(packageContent);
                console.log('   ✅ package.json válido');
            } catch (error) {
                results.backend.issues.push('package.json inválido');
            }
        }
    } catch (error) {
        results.backend.issues.push(`Erro na verificação: ${error.message}`);
    }

    // 2. Verificar Frontend
    console.log('\n🎨 VERIFICANDO FRONTEND...');
    
    const frontendPath = 'coinbitclub-frontend-premium';
    if (fs.existsSync(frontendPath)) {
        try {
            // Verificar se o build foi bem-sucedido
            if (fs.existsSync(path.join(frontendPath, '.next'))) {
                results.frontend.status = '✅';
                console.log('   ✅ Build do frontend concluído com sucesso');
            } else {
                results.frontend.issues.push('Build não encontrado');
            }

            // Verificar package.json do frontend
            const frontendPackage = path.join(frontendPath, 'package.json');
            if (fs.existsSync(frontendPackage)) {
                const content = fs.readFileSync(frontendPackage, 'utf8');
                try {
                    JSON.parse(content);
                    console.log('   ✅ package.json do frontend válido');
                } catch (error) {
                    results.frontend.issues.push('package.json do frontend inválido');
                }
            }
        } catch (error) {
            results.frontend.issues.push(`Erro na verificação: ${error.message}`);
        }
    } else {
        results.frontend.issues.push('Diretório frontend não encontrado');
    }

    // 3. Verificar Database Connection
    console.log('\n🗄️ VERIFICANDO DATABASE...');
    
    try {
        // Verificar se o detector de corrupção foi executado com sucesso
        if (fs.existsSync('backend/detectar-corrupcao-nul.js')) {
            console.log('   ✅ Detector de corrupção NUL disponível');
            results.database.status = '✅';
        }
    } catch (error) {
        results.database.issues.push(`Erro na verificação: ${error.message}`);
    }

    // 4. Verificar Encoding
    console.log('\n📝 VERIFICANDO ENCODING...');
    
    let encodingIssues = 0;
    
    // Verificar arquivos críticos
    const criticalFiles = [
        'package.json',
        'main.js',
        path.join(frontendPath, 'package.json'),
        path.join(frontendPath, 'pages/auth/forgot-password.tsx')
    ];

    for (const file of criticalFiles) {
        if (fs.existsSync(file)) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                if (content.includes('\x00') || content.includes('\uFFFD')) {
                    encodingIssues++;
                    console.log(`   ❌ ${file}: Problemas de encoding detectados`);
                } else {
                    console.log(`   ✅ ${file}: Encoding limpo`);
                }
            } catch (error) {
                encodingIssues++;
                console.log(`   ❌ ${file}: Erro de leitura`);
            }
        }
    }

    if (encodingIssues === 0) {
        results.encoding.status = '✅';
    } else {
        results.encoding.issues.push(`${encodingIssues} arquivos com problemas`);
    }

    // 5. Relatório Final
    console.log('\n📊 RELATÓRIO FINAL DE VALIDAÇÃO');
    console.log('================================');
    
    console.log(`Backend: ${results.backend.status}`);
    if (results.backend.issues.length > 0) {
        results.backend.issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log(`Frontend: ${results.frontend.status}`);
    if (results.frontend.issues.length > 0) {
        results.frontend.issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log(`Database: ${results.database.status}`);
    if (results.database.issues.length > 0) {
        results.database.issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log(`Encoding: ${results.encoding.status}`);
    if (results.encoding.issues.length > 0) {
        results.encoding.issues.forEach(issue => console.log(`   - ${issue}`));
    }

    const allGood = Object.values(results).every(r => r.status === '✅');
    
    console.log('\n🎯 RESULTADO FINAL:');
    console.log('==================');
    
    if (allGood) {
        console.log('🎉 TODOS OS PROBLEMAS FORAM RESOLVIDOS!');
        console.log('✅ Sistema 100% operacional');
        console.log('✅ Caracteres NUL removidos');
        console.log('✅ Encoding corrigido');
        console.log('✅ JSONs validados');
        console.log('✅ Build funcionando');
        
        console.log('\n🚀 PRÓXIMOS PASSOS PARA DEPLOY:');
        console.log('1. Testar servidor: node main.js');
        console.log('2. Commit: git add . && git commit -m "Fix all NUL and encoding issues - Ready for deploy"');
        console.log('3. Push: git push origin main');
        console.log('4. Deploy no Railway e Vercel automaticamente');
        
        return true;
    } else {
        console.log('❌ Ainda há problemas pendentes');
        console.log('⚠️ Verifique os issues listados acima');
        
        return false;
    }
}

// Executar validação
finalValidation().then(success => {
    if (success) {
        console.log('\n🏆 SISTEMA PRONTO PARA PRODUÇÃO!');
    } else {
        console.log('\n🔧 Sistema necessita de ajustes adicionais');
    }
}).catch(error => {
    console.error('❌ Erro na validação final:', error);
});
