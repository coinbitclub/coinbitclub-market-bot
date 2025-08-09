const fs = require('fs');
const path = require('path');

// Lista de arquivos e padrões a limpar
const filesToClean = [
    { file: '.env.template', patterns: [
        /TWILIO_ACCOUNT_SID=AC[a-z0-9]+/g,
        /TWILIO_AUTH_TOKEN=[a-z0-9]+/g,
        /STRIPE_SECRET_KEY=sk_[a-z0-9_]+/g,
        /OPENAI_API_KEY=sk-[a-zA-Z0-9-]+/g
    ]},
    { file: 'correcoes-bybit-twilio.js', patterns: [
        /AC[a-z0-9]{32}/g,
        /[a-z0-9]{32}/g
    ]},
    { file: 'twilio-corrigido.js', patterns: [
        /AC[a-z0-9]{32}/g,
        /[a-z0-9]{32}/g
    ]},
    { file: 'verificador-completo-integracoes-externas.js', patterns: [
        /AC[a-z0-9]{32}/g,
        /[a-z0-9]{32}/g,
        /sk_[a-z0-9_]+/g
    ]},
    { file: 'verificador-integracoes-externas-completo.js', patterns: [
        /AC[a-z0-9]{32}/g,
        /[a-z0-9]{32}/g,
        /sk_[a-z0-9_]+/g
    ]},
    { file: 'orquestrador-final-completo-v6.js', patterns: [
        /[a-z0-9]{32}/g
    ]},
    { file: 'system-validation-complete.js', patterns: [
        /[a-z0-9]{32}/g
    ]},
    { file: 'DOCUMENTACAO-OPERACAO-REAL.md', patterns: [
        /sk_[a-z0-9_]+/g
    ]},
    { file: 'RESPOSTAS-FINAIS-COMPLETAS.md', patterns: [
        /sk_[a-z0-9_]+/g
    ]},
    { file: 'sistema-completo-pagamentos-stripe-producao.js', patterns: [
        /sk_[a-z0-9_]+/g
    ]},
    { file: 'SISTEMA-100-PORCENTO-PRONTO.md', patterns: [
        /sk-[a-zA-Z0-9-]+/g
    ]}
];

console.log('🧹 Iniciando limpeza de dados sensíveis...');

filesToClean.forEach(({ file, patterns }) => {
    const filePath = path.join(__dirname, file);
    
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        patterns.forEach(pattern => {
            if (pattern.test(content)) {
                content = content.replace(pattern, '[SENSITIVE_DATA_REMOVED]');
                modified = true;
            }
        });
        
        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Limpo: ${file}`);
        } else {
            console.log(`⏭️  Já limpo: ${file}`);
        }
    } else {
        console.log(`❌ Arquivo não encontrado: ${file}`);
    }
});

console.log('✨ Limpeza concluída!');
