/**
 * 🔧 CORREÇÃO DAS ROTAS DO SERVER.JS
 * Corrigindo problema de roteamento dos gestores
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 CORRIGINDO ROTAS DO SERVIDOR...');

// Ler o arquivo server.js atual
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

console.log('📖 Lendo server.js atual...');

// Verificar se já tem as rotas dos gestores
if (serverContent.includes('/api/gestores/chaves')) {
    console.log('✅ Rotas dos gestores já estão configuradas');
    
    // Verificar se há problemas de middleware
    if (serverContent.includes('catch-all middleware')) {
        console.log('⚠️ Middleware catch-all detectado - pode estar interferindo');
        
        // Remover middleware problemático
        serverContent = serverContent.replace(/\/\/ Middleware catch-all[\s\S]*?res\.status\(404\)[\s\S]*?}\);/g, '');
        
        console.log('🔧 Removendo middleware catch-all problemático...');
    }
    
    // Adicionar middleware específico para debug
    const debugMiddleware = `
// Debug middleware para verificar rotas
app.use('/api/gestores', (req, res, next) => {
    console.log('🔍 Debug - Rota gestor acessada:', req.method, req.originalUrl);
    next();
});

`;
    
    // Inserir após as importações
    serverContent = serverContent.replace(
        /const afiliadosRoutes = require\('\.\/routes\/afiliadosRoutes'\);/,
        `const afiliadosRoutes = require('./routes/afiliadosRoutes');

${debugMiddleware}`
    );
    
    // Escrever arquivo corrigido
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Server.js corrigido com debug middleware');
    
} else {
    console.log('❌ Rotas dos gestores não encontradas no server.js');
}

// Testar se as rotas existem
const routeFiles = [
    './routes/chavesRoutes.js',
    './routes/usuariosRoutes.js', 
    './routes/afiliadosRoutes.js'
];

console.log('\n📋 VERIFICANDO ARQUIVOS DE ROTAS:');
routeFiles.forEach(routeFile => {
    if (fs.existsSync(routeFile)) {
        console.log(`✅ ${routeFile} - OK`);
    } else {
        console.log(`❌ ${routeFile} - NÃO ENCONTRADO`);
    }
});

console.log('\n🔧 Correção concluída! Reinicie o servidor para aplicar as mudanças.');
