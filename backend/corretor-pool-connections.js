#!/usr/bin/env node

/**
 * 🔧 CORRETOR POOL CONNECTIONS - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Corrige problemas de conexão de pool nos componentes
 */

const fs = require('fs');
const path = require('path');

const COMPONENTES_PARA_CORRIGIR = [
    'risk-manager.js',
    'ai-guardian.js'
];

function corrigirGerenciamentoPool(arquivo) {
    console.log(`🔧 Corrigindo ${arquivo}...`);
    
    const caminhoArquivo = path.join(__dirname, arquivo);
    
    if (!fs.existsSync(caminhoArquivo)) {
        console.log(`⚠️ Arquivo ${arquivo} não encontrado`);
        return false;
    }

    let conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
    
    // Substituir finalizações problemáticas do pool
    const patterns = [
        {
            // Remover await this.pool.end() em loops ou callbacks
            search: /await this\.pool\.end\(\);?\s*$/gm,
            replace: '// Pool será finalizado pelo componente principal'
        },
        {
            // Corrigir finalização dupla
            search: /this\.pool\.end\(\);\s*await this\.pool\.end\(\);?/g,
            replace: 'await this.pool.end();'
        },
        {
            // Adicionar verificação antes de usar pool
            search: /(await this\.pool\.query\()/g,
            replace: 'if (this.pool && !this.pool.ended) { await this.pool.query('
        }
    ];

    let modificado = false;
    
    patterns.forEach(pattern => {
        if (pattern.search.test(conteudo)) {
            conteudo = conteudo.replace(pattern.search, pattern.replace);
            modificado = true;
        }
    });

    // Adicionar método de verificação de pool se não existir
    if (!conteudo.includes('verificarPool()')) {
        const metodoVerificacao = `
    verificarPool() {
        if (!this.pool || this.pool.ended) {
            console.log('⚠️ Pool de conexão não disponível');
            return false;
        }
        return true;
    }
`;

        // Inserir antes do último método
        const ultimoMetodoRegex = /(async finalizar\(\)[^}]*})/;
        if (ultimoMetodoRegex.test(conteudo)) {
            conteudo = conteudo.replace(ultimoMetodoRegex, metodoVerificacao + '\n    $1');
            modificado = true;
        }
    }

    if (modificado) {
        fs.writeFileSync(caminhoArquivo, conteudo, 'utf8');
        console.log(`✅ ${arquivo} corrigido`);
        return true;
    } else {
        console.log(`✓ ${arquivo} já estava correto`);
        return false;
    }
}

function executarCorrecoes() {
    console.log('🔧 INICIANDO CORREÇÃO DE POOL CONNECTIONS');
    console.log('=====================================');
    
    let totalCorrigidos = 0;
    
    COMPONENTES_PARA_CORRIGIR.forEach(arquivo => {
        if (corrigirGerenciamentoPool(arquivo)) {
            totalCorrigidos++;
        }
    });
    
    console.log('=====================================');
    console.log(`✅ Correções concluídas: ${totalCorrigidos}/${COMPONENTES_PARA_CORRIGIR.length} arquivos modificados`);
    
    return totalCorrigidos;
}

// Executar se chamado diretamente
if (require.main === module) {
    try {
        const corrigidos = executarCorrecoes();
        
        if (corrigidos > 0) {
            console.log('🎉 Correções aplicadas com sucesso!');
            console.log('💡 Execute a validação novamente para verificar as melhorias');
        } else {
            console.log('ℹ️ Nenhuma correção necessária');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('💥 Erro durante as correções:', error.message);
        process.exit(1);
    }
}

module.exports = { corrigirGerenciamentoPool, executarCorrecoes };
