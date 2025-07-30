#!/usr/bin/env node

/**
 * 🔧 CORRETOR SINTAXE ESPECÍFICA - COINBITCLUB MARKET BOT V3.0.0
 */

const fs = require('fs');

function corrigirSintaxeEspecifica(arquivo) {
    console.log(`🔧 Corrigindo sintaxe específica em ${arquivo}...`);
    
    let conteudo = fs.readFileSync(arquivo, 'utf8');
    
    // Corrigir padrão específico problemático: "= if (this.pool"
    const regex = /(\w+)\s*=\s*if\s*\(this\.pool\s*&&\s*!this\.pool\.ended\)\s*\{\s*await\s*this\.pool\.query\(/g;
    
    conteudo = conteudo.replace(regex, (match, varName) => {
        return `let ${varName};\n            if (this.pool && !this.pool.ended) {\n                ${varName} = await this.pool.query(`;
    });
    
    // Corrigir fechamentos de método incompletos
    conteudo = conteudo.replace(/(\s+)(\}\s*)(\s+)(async\s+\w+)/g, '$1$2\n$1$4');
    
    fs.writeFileSync(arquivo, conteudo, 'utf8');
    console.log(`✅ ${arquivo} corrigido`);
}

// Corrigir ambos os arquivos
try {
    corrigirSintaxeEspecifica('ai-guardian.js');
    corrigirSintaxeEspecifica('risk-manager.js');
    
    console.log('🎉 Correções de sintaxe concluídas!');
} catch (error) {
    console.error('❌ Erro nas correções:', error.message);
}
