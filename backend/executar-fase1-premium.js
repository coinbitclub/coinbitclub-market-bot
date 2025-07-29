// ====================================
// 🚀 EXECUTAR FASE 1 ATUALIZADA
// Meta: Usar Frontend Premium Existente + 95%
// ====================================

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🚀 INICIANDO FASE 1 ATUALIZADA: FRONTEND PREMIUM');
console.log('=================================================');
console.log('🎯 Meta: 95%+ aproveitamento nos testes');
console.log('📱 Frontend: coinbitclub-frontend-premium existente\n');

// ==============================================
// F1.1: CONFIGURAR FRONTEND PREMIUM EXISTENTE
// ==============================================

async function configurarFrontendPremium() {
    console.log('📱 F1.1: Configurando Frontend Premium existente...');
    
    const frontendPremiumDir = path.join(__dirname, '..', 'coinbitclub-frontend-premium');
    
    // Verificar se existe
    if (!fs.existsSync(frontendPremiumDir)) {
        console.log('❌ Diretório coinbitclub-frontend-premium não encontrado!');
        return false;
    }
    
    console.log('✅ Frontend Premium encontrado:', frontendPremiumDir);
    
    // Verificar package.json
    const packageJsonPath = path.join(frontendPremiumDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        console.log('✅ Package.json encontrado:', packageJson.name);
        console.log('   Scripts disponíveis:', Object.keys(packageJson.scripts || {}));
    }
    
    // Verificar páginas principais
    const pagesDir = path.join(frontendPremiumDir, 'pages');
    if (fs.existsSync(pagesDir)) {
        const pages = fs.readdirSync(pagesDir);
        console.log('✅ Páginas encontradas:', pages.length);
        
        const mainPages = ['index.tsx', 'login.tsx', 'dashboard.tsx', 'signup.tsx'];
        mainPages.forEach(page => {
            const pagePath = path.join(pagesDir, page);
            if (fs.existsSync(pagePath)) {
                console.log(`   ✅ ${page} - OK`);
            } else {
                console.log(`   ⚠️ ${page} - Não encontrado`);
            }
        });
        
        // Verificar diretórios de páginas
        const pagesDirs = ['admin', 'user', 'api', 'auth'];
        pagesDirs.forEach(dir => {
            const dirPath = path.join(pagesDir, dir);
            if (fs.existsSync(dirPath)) {
                const dirPages = fs.readdirSync(dirPath);
                console.log(`   ✅ /${dir}/ - ${dirPages.length} páginas`);
            }
        });
    }
    
    return true;
}

// ==============================================
// F1.2: CORRIGIR ENDPOINT USER REGISTRATION  
// ==============================================

function corrigirEndpointRegistro() {
    console.log('🔧 F1.2: Corrigindo endpoint de registro...');
    
    const serverPath = path.join(__dirname, 'api-gateway', 'server.cjs');
    
    if (!fs.existsSync(serverPath)) {
        console.log('⚠️ Arquivo server.cjs não encontrado');
        return false;
    }
    
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Verificar se já tem a função registerUser melhorada
    if (serverContent.includes('Validar dados obrigatórios')) {
        console.log('✅ Endpoint de registro já está atualizado');
        return true;
    }
    
    // Procurar e corrigir a função registerUser
    const registerFunctionRegex = /async function registerUser\(req, res\) \{[\s\S]*?\n\}/;
    
    const newRegisterFunction = `async function registerUser(req, res) {
  try {
    const { email, name, password, phone, role = 'user' } = req.body;
    
    console.log('📝 Tentativa de registro:', {
      email,
      name,
      role,
      phone: phone ? 'fornecido' : 'não fornecido'
    });

    // Validar dados obrigatórios
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email e nome são obrigatórios'
      });
    }

    // Verificar se usuário já existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso'
      });
    }

    // Hash da senha simples (depois implementar bcrypt)
    const hashedPassword = password ? 'hash_' + password + '_' + Date.now() : 'temp_password';

    // Inserir usuário
    const result = await pool.query(\`
      INSERT INTO users (email, name, password, whatsapp, role, status) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, email, name, role, status
    \`, [email, name, hashedPassword, phone, role, 'active']);

    const user = result.rows[0];
    
    console.log('✅ Usuário criado com sucesso:', user.id);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Erro no registro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}`;
    
    if (registerFunctionRegex.test(serverContent)) {
        serverContent = serverContent.replace(registerFunctionRegex, newRegisterFunction);
        fs.writeFileSync(serverPath, serverContent);
        console.log('✅ Endpoint de registro corrigido');
        return true;
    } else {
        console.log('⚠️ Função registerUser não encontrada no formato esperado');
        return false;
    }
}

// ==============================================
// F1.3: SCRIPTS DE STARTUP PARA FRONTEND PREMIUM
// ==============================================

function criarStartupScripts() {
    console.log('🚀 F1.3: Criando scripts de startup...');
    
    // Script para iniciar frontend premium
    const startFrontendPremium = `// ====================================
// 🚀 INICIAR FRONTEND PREMIUM COINBITCLUB
// ====================================

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Iniciando Frontend Premium CoinbitClub MarketBot...');
console.log('📍 Porta: 3000');
console.log('🔗 URL: http://localhost:3000');

const frontendDir = path.join(__dirname, '..', 'coinbitclub-frontend-premium');

// Verificar se existe diretório
if (!fs.existsSync(frontendDir)) {
    console.log('❌ Diretório coinbitclub-frontend-premium não encontrado');
    process.exit(1);
}

// Navegar para diretório do frontend premium
process.chdir(frontendDir);

// Verificar se node_modules existe
if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
    console.log('📦 Instalando dependências do frontend premium...');
    const install = spawn('npm', ['install'], {
        stdio: 'inherit',
        shell: true
    });
    
    install.on('close', (code) => {
        if (code === 0) {
            startNextApp();
        } else {
            console.error('❌ Erro ao instalar dependências');
        }
    });
} else {
    startNextApp();
}

function startNextApp() {
    console.log('🚀 Iniciando aplicação Next.js Premium...');
    
    const server = spawn('npm', ['run', 'dev'], {
        stdio: 'inherit',
        shell: true
    });

    server.on('error', (error) => {
        console.error('❌ Erro ao iniciar frontend premium:', error);
    });

    server.on('close', (code) => {
        console.log(\`🔚 Frontend premium finalizado com código \${code}\`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\\n🛑 Parando frontend premium...');
        server.kill('SIGINT');
    });
}`;
    
    fs.writeFileSync(path.join(__dirname, 'start-frontend-premium.js'), startFrontendPremium);
    
    // Script para sistema completo com frontend premium
    const startSystemPremium = `// ====================================
// 🚀 INICIAR SISTEMA COMPLETO PREMIUM
// ====================================

const { spawn } = require('child_process');

console.log('🚀 INICIANDO SISTEMA COMPLETO COINBITCLUB PREMIUM');
console.log('==================================================');
console.log('🔹 Backend: http://localhost:8080');
console.log('🔹 Frontend Premium: http://localhost:3000');
console.log('🔹 Para parar: Ctrl+C');

let backend, frontend;

// Iniciar backend
console.log('\\n1️⃣ Iniciando Backend...');
backend = spawn('node', ['start-backend.js'], {
    stdio: 'pipe',
    shell: true
});

backend.stdout.on('data', (data) => {
    console.log(\`[BACKEND] \${data.toString().trim()}\`);
});

backend.stderr.on('data', (data) => {
    console.error(\`[BACKEND ERROR] \${data.toString().trim()}\`);
});

// Aguardar backend e iniciar frontend premium
setTimeout(() => {
    console.log('\\n2️⃣ Iniciando Frontend Premium...');
    frontend = spawn('node', ['start-frontend-premium.js'], {
        stdio: 'pipe',
        shell: true
    });

    frontend.stdout.on('data', (data) => {
        console.log(\`[FRONTEND] \${data.toString().trim()}\`);
    });

    frontend.stderr.on('data', (data) => {
        console.error(\`[FRONTEND ERROR] \${data.toString().trim()}\`);
    });
}, 3000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\\n🛑 Parando sistema completo premium...');
    if (backend) backend.kill('SIGINT');
    if (frontend) frontend.kill('SIGINT');
    process.exit(0);
});`;
    
    fs.writeFileSync(path.join(__dirname, 'start-system-premium.js'), startSystemPremium);
    
    console.log('✅ Scripts de startup premium criados');
}

// ==============================================
// EXECUTAR FASE 1 ATUALIZADA
// ==============================================

async function executarFase1Atualizada() {
    try {
        console.log('⏱️ Iniciando execução da Fase 1 Atualizada...\n');
        
        // F1.1: Configurar Frontend Premium
        const frontendOk = await configurarFrontendPremium();
        if (!frontendOk) {
            console.log('❌ Erro ao configurar frontend premium');
            return;
        }
        
        // F1.2: Corrigir registro
        const registroOk = corrigirEndpointRegistro();
        
        // F1.3: Scripts de startup
        criarStartupScripts();
        
        console.log('\n🎉 FASE 1 ATUALIZADA CONCLUÍDA COM SUCESSO!');
        console.log('===========================================');
        console.log('✅ Frontend Premium configurado');
        console.log('✅ Páginas verificadas (index, login, dashboard, signup, admin, user)');
        console.log(registroOk ? '✅ Endpoint de registro corrigido' : '⚠️ Endpoint de registro precisa revisão');
        console.log('✅ Scripts de startup premium criados');
        
        console.log('\n🚀 PRÓXIMOS PASSOS:');
        console.log('1. Testar sistema: node start-system-premium.js');
        console.log('2. Executar homologação: node scripts/homologacao-completa.js');
        console.log('3. Verificar se atingiu 95%+');
        
        console.log('\n📋 COMANDOS DISPONÍVEIS:');
        console.log('   node start-backend.js         - Apenas backend');
        console.log('   node start-frontend-premium.js - Apenas frontend premium');
        console.log('   node start-system-premium.js  - Sistema completo premium');
        
        console.log('\n📱 PÁGINAS FRONTEND PREMIUM DISPONÍVEIS:');
        console.log('   http://localhost:3000         - Home');
        console.log('   http://localhost:3000/login   - Login');
        console.log('   http://localhost:3000/signup  - Cadastro');
        console.log('   http://localhost:3000/dashboard - Dashboard');
        console.log('   http://localhost:3000/admin   - Admin');
        console.log('   http://localhost:3000/user    - User');
        
    } catch (error) {
        console.error('❌ Erro na execução da Fase 1 Atualizada:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    executarFase1Atualizada();
}

module.exports = { executarFase1Atualizada };
