const fs = require('fs');
const path = require('path');

console.log('🔍 DETECTOR DE ORIGEM DO ERRO NUL');
console.log('=================================');

// Verificar variáveis de ambiente
console.log('\n📋 VARIÁVEIS DE AMBIENTE RELEVANTES:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('PORT:', process.env.PORT || 'undefined');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'definido' : 'undefined');

// Verificar argumentos de linha de comando
console.log('\n📋 ARGUMENTOS DE LINHA DE COMANDO:');
console.log('process.argv:', JSON.stringify(process.argv, null, 2));

// Verificar diretório atual
console.log('\n📋 DIRETÓRIO ATUAL:');
console.log('process.cwd():', process.cwd());
console.log('__dirname:', __dirname);
console.log('__filename:', __filename);

// Verificar se existe algum arquivo .env com problemas
console.log('\n🔍 VERIFICANDO ARQUIVOS .env:');
const envFiles = ['.env', '.env.local', '.env.development', '.env.production', '.env.railway'];

for (const envFile of envFiles) {
    const envPath = path.join(__dirname, envFile);
    if (fs.existsSync(envPath)) {
        console.log(`\n📄 ${envFile}:`);
        try {
            const content = fs.readFileSync(envPath, 'utf8');
            
            // Verificar caracteres NUL
            const hasNul = content.includes('\x00');
            const nullCount = (content.match(/\x00/g) || []).length;
            
            console.log(`   Tamanho: ${content.length} bytes`);
            console.log(`   Caracteres NUL: ${nullCount}`);
            console.log(`   Linhas: ${content.split('\n').length}`);
            
            if (hasNul) {
                console.log(`   ❌ ARQUIVO .env COM CARACTERES NUL DETECTADO!`);
                
                // Fazer backup
                const backup = envPath + '.nul-backup-' + Date.now();
                fs.writeFileSync(backup, content);
                
                // Limpar e reescrever
                const cleanContent = content.replace(/\x00/g, '').replace(/\uFFFD/g, '');
                fs.writeFileSync(envPath, cleanContent, 'utf8');
                console.log(`   ✅ Arquivo ${envFile} limpo!`);
            } else {
                console.log(`   ✅ Arquivo limpo`);
            }
            
            // Mostrar primeiras linhas (sem senhas)
            const lines = content.split('\n').slice(0, 5);
            console.log(`   Primeiras linhas:`);
            lines.forEach((line, idx) => {
                if (line.trim() && !line.includes('PASSWORD') && !line.includes('SECRET') && !line.includes('KEY')) {
                    console.log(`     ${idx + 1}: ${line.substring(0, 50)}${line.length > 50 ? '...' : ''}`);
                } else if (line.trim()) {
                    console.log(`     ${idx + 1}: [SENSÍVEL]`);
                }
            });
            
        } catch (error) {
            console.log(`   ❌ Erro ao ler: ${error.message}`);
        }
    } else {
        console.log(`   ⚠️  ${envFile}: Não encontrado`);
    }
}

// Verificar arquivos de configuração na raiz
console.log('\n🔍 VERIFICANDO ARQUIVOS DE CONFIGURAÇÃO:');
const configFiles = ['vercel.json', 'railway.json', 'next.config.js', 'tsconfig.json'];

for (const configFile of configFiles) {
    const configPath = path.join(__dirname, configFile);
    if (fs.existsSync(configPath)) {
        console.log(`\n📄 ${configFile}:`);
        try {
            const content = fs.readFileSync(configPath, 'utf8');
            const hasNul = content.includes('\x00');
            const nullCount = (content.match(/\x00/g) || []).length;
            
            console.log(`   Tamanho: ${content.length} bytes`);
            console.log(`   Caracteres NUL: ${nullCount}`);
            
            if (hasNul) {
                console.log(`   ❌ CARACTERES NUL DETECTADOS!`);
                
                // Limpar arquivo
                const cleanContent = content.replace(/\x00/g, '').replace(/\uFFFD/g, '');
                const backup = configPath + '.nul-backup-' + Date.now();
                fs.writeFileSync(backup, content);
                fs.writeFileSync(configPath, cleanContent, 'utf8');
                console.log(`   ✅ Arquivo ${configFile} limpo!`);
            } else {
                console.log(`   ✅ Arquivo limpo`);
            }
        } catch (error) {
            console.log(`   ❌ Erro ao ler: ${error.message}`);
        }
    }
}

// Verificar se há algum processo em background causando o problema
console.log('\n🔍 VERIFICANDO PROCESSOS E CONTEXTO:');
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Node version:', process.version);
console.log('Memory usage:', JSON.stringify(process.memoryUsage(), null, 2));

console.log('\n✅ DIAGNÓSTICO COMPLETO FINALIZADO');
console.log('==================================');
