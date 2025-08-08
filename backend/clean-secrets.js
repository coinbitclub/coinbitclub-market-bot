const fs = require('fs');
const path = require('path');

// 🧹 SCRIPT FOCADO NOS SECRETS DETECTADOS PELO GITHUB
console.log('🧹 LIMPANDO APENAS SECRETS DETECTADOS PELO GITHUB');
console.log('================================================');

// Arquivos específicos detectados pelo GitHub
const githubDetectedFiles = [
    '.env.example',
    'sistema-stripe-real-completo.js',
    'stripe-links-real-system.js', 
    'stripe-system-simplified.js',
    'teste-stripe-final.js'
];

function cleanSpecificSecrets(fileName) {
    const filePath = path.join(__dirname, fileName);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${fileName} não encontrado`);
        return false;
    }
    
    console.log(`🔧 Processando ${fileName}...`);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Padrões específicos detectados pelo GitHub
        const secretPatterns = [
            // Stripe API Keys (exatos do GitHub)
            { regex: /sk_live_[a-zA-Z0-9]{99}/g, replacement: 'sk_live_STRIPE_SECRET_KEY_HERE', name: 'Stripe Live Secret' },
            { regex: /pk_live_[a-zA-Z0-9]{99}/g, replacement: 'pk_live_STRIPE_PUBLISHABLE_KEY_HERE', name: 'Stripe Live Publishable' },
            { regex: /sk_test_[a-zA-Z0-9]{99}/g, replacement: 'sk_test_STRIPE_TEST_SECRET_KEY_HERE', name: 'Stripe Test Secret' },
            { regex: /pk_test_[a-zA-Z0-9]{99}/g, replacement: 'pk_test_STRIPE_TEST_PUBLISHABLE_KEY_HERE', name: 'Stripe Test Publishable' },
            
            // Highnote SK Live Key (detectado pelo GitHub)
            { regex: /hn_live_[a-zA-Z0-9_]{40,}/g, replacement: 'hn_live_HIGHNOTE_API_KEY_HERE', name: 'Highnote Live Key' },
            { regex: /hn_test_[a-zA-Z0-9_]{40,}/g, replacement: 'hn_test_HIGHNOTE_API_KEY_HERE', name: 'Highnote Test Key' },
            
            // Padrões mais genéricos para capturar variações
            { regex: /sk_live_[a-zA-Z0-9_]{98,102}/g, replacement: 'sk_live_STRIPE_SECRET_KEY_HERE', name: 'Stripe Live (genérico)' },
            { regex: /hn_[a-zA-Z0-9_]{40,}/g, replacement: 'hn_HIGHNOTE_API_KEY_HERE', name: 'Highnote (genérico)' }
        ];
        
        secretPatterns.forEach(pattern => {
            const matches = content.match(pattern.regex);
            if (matches) {
                content = content.replace(pattern.regex, pattern.replacement);
                modified = true;
                console.log(`  ✅ ${pattern.name}: ${matches.length} ocorrências removidas`);
            }
        });
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${fileName} limpo com sucesso`);
            return true;
        } else {
            console.log(`ℹ️  ${fileName} - nenhum secret encontrado`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Erro ao processar ${fileName}:`, error.message);
        return false;
    }
}

// Processar apenas os arquivos detectados pelo GitHub
let cleanedFiles = 0;
githubDetectedFiles.forEach(fileName => {
    if (cleanSpecificSecrets(fileName)) {
        cleanedFiles++;
    }
});

console.log('\n📊 RESULTADO DA LIMPEZA:');
console.log('========================');
console.log(`✅ ${cleanedFiles} arquivos processados e limpos`);
console.log(`📁 ${githubDetectedFiles.length} arquivos verificados`);
console.log('🔒 Sistema Aguia News mantido intacto');
console.log('🚀 Pronto para novo push sem secrets');

console.log('\n📝 PLACEHOLDERS CRIADOS:');
console.log('- sk_live_STRIPE_SECRET_KEY_HERE');
console.log('- pk_live_STRIPE_PUBLISHABLE_KEY_HERE'); 
console.log('- hn_live_HIGHNOTE_API_KEY_HERE');
console.log('\n💡 Substitua pelos valores reais em produção');
