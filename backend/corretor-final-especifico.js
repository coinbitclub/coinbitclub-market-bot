#!/usr/bin/env node

/**
 * 🔧 CORRETOR FINAL ESPECÍFICO - COINBITCLUB MARKET BOT V3.0.0
 */

const fs = require('fs');

function corrigirProblemasEspecificos(arquivo) {
    console.log(`🔧 Corrigindo problemas específicos em ${arquivo}...`);
    
    let conteudo = fs.readFileSync(arquivo, 'utf8');
    
    // Corrigir "const let" -> "let"
    conteudo = conteudo.replace(/const\s+let\s+/g, 'let ');
    
    // Corrigir outros padrões problemáticos
    conteudo = conteudo.replace(/let\s+let\s+/g, 'let ');
    conteudo = conteudo.replace(/var\s+let\s+/g, 'let ');
    
    fs.writeFileSync(arquivo, conteudo, 'utf8');
    console.log(`✅ ${arquivo} corrigido`);
}

// Corrigir ambos os arquivos
try {
    corrigirProblemasEspecificos('ai-guardian.js');
    corrigirProblemasEspecificos('risk-manager.js');
    
    console.log('🎉 Correções específicas concluídas!');
} catch (error) {
    console.error('❌ Erro nas correções:', error.message);
}
