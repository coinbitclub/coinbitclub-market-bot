/**
 * 📋 GUIA PASSO-A-PASSO: ADICIONAR IP NA WHITELIST BYBIT
 * Instruções detalhadas para corrigir o problema
 */

console.log('📋 GUIA PASSO-A-PASSO: ADICIONAR IP NA WHITELIST BYBIT');
console.log('='.repeat(60));

console.log('\n🎯 PROBLEMA IDENTIFICADO:');
console.log('   • Migração Railway mudou o IP do servidor');
console.log('   • IP atual: 132.255.160.140');
console.log('   • Erro 10003: IP não está na whitelist');
console.log('   • Todas as chaves falham por causa do IP');

console.log('\n🔐 SOLUÇÃO: ADICIONAR IP NA CONTA BYBIT');
console.log('='.repeat(40));

console.log('\n📱 PASSO 1: ACESSAR CONTA BYBIT');
console.log('   1. Abra o navegador');
console.log('   2. Acesse: https://www.bybit.com');
console.log('   3. Clique em "Log In" (canto superior direito)');
console.log('   4. Digite email e senha da conta da Paloma');
console.log('   5. Complete autenticação 2FA se solicitada');

console.log('\n⚙️  PASSO 2: NAVEGAR PARA API MANAGEMENT');
console.log('   1. Após login, clique no ícone do perfil (canto superior direito)');
console.log('   2. No menu dropdown, clique em "Account & Security"');
console.log('   3. Na página que abrir, procure "API Management"');
console.log('   4. Clique em "API Management"');

console.log('\n🔑 PASSO 3: LOCALIZAR CHAVES API');
console.log('   1. Você verá uma lista de chaves API criadas');
console.log('   2. Procure pelas chaves que estão sendo usadas no sistema');
console.log('   3. Devem ter nomes como "Trading Bot" ou similar');
console.log('   4. Clique em "Edit" ou "Manage" na chave');

console.log('\n🌐 PASSO 4: ADICIONAR IP NA WHITELIST');
console.log('   1. Na página de edição da chave API');
console.log('   2. Procure seção "IP Restrictions" ou "Whitelist"');
console.log('   3. Clique em "Add IP" ou "+" ou "Edit IP"');
console.log('   4. Digite o IP: 132.255.160.140');
console.log('   5. Clique em "Confirm" ou "Save"');
console.log('   6. Pode pedir confirmação por email/SMS');

console.log('\n✅ PASSO 5: VERIFICAR PERMISSÕES');
console.log('   1. Ainda na página da chave API');
console.log('   2. Verifique se as permissões estão corretas:');
console.log('      • ✅ Spot Trading');
console.log('      • ✅ Derivatives Trading (se usar futuros)');
console.log('      • ✅ Account Transfer');
console.log('      • ❌ Withdrawals (NÃO habilitar por segurança)');
console.log('   3. Salve as alterações');

console.log('\n🔄 PASSO 6: AGUARDAR PROPAGAÇÃO');
console.log('   1. Mudanças podem levar 1-5 minutos para propagar');
console.log('   2. Execute o monitoramento em tempo real:');
console.log('      node monitorar-whitelist.js');
console.log('   3. Ou teste manualmente após alguns minutos:');
console.log('      node teste-pos-correcao.js');

console.log('\n🚨 IMPORTANTE - SE NÃO ENCONTRAR CHAVES:');
console.log('='.repeat(45));
console.log('   • Se não há chaves API na conta:');
console.log('     1. Clique em "Create API Key"');
console.log('     2. Nome: "CoinbitClub Trading Bot"');
console.log('     3. Permissões: Spot Trading + Derivatives');
console.log('     4. IP Restriction: 132.255.160.140');
console.log('     5. ANOTE a chave e secret gerados');
console.log('     6. Atualize no banco de dados');

console.log('\n🔧 COMANDOS DISPONÍVEIS:');
console.log('='.repeat(25));
console.log('   📊 Monitorar em tempo real:');
console.log('      node monitorar-whitelist.js');
console.log('');
console.log('   🧪 Teste após adicionar IP:');
console.log('      node teste-pos-correcao.js');
console.log('');
console.log('   🔍 Diagnóstico detalhado:');
console.log('      node teste-diagnostico-ip.js');
console.log('');
console.log('   💾 Verificar banco de dados:');
console.log('      node check-api-keys-table.js');

console.log('\n💡 DICAS IMPORTANTES:');
console.log('='.repeat(20));
console.log('   • Use conta da Paloma (não outra pessoa)');
console.log('   • IP exato: 132.255.160.140 (sem espaços)');
console.log('   • Aguarde propagação (1-5 minutos)');
console.log('   • Se criar novas chaves, anote bem');
console.log('   • Mantenha 2FA ativo para segurança');

console.log('\n🎉 RESULTADO ESPERADO:');
console.log('='.repeat(25));
console.log('   ✅ Erro 10003 desaparece');
console.log('   ✅ Chaves retornam dados da conta');
console.log('   ✅ Sistema volta a operar normalmente');
console.log('   ✅ TradingView webhooks funcionam');

console.log('\n📞 EM CASO DE DÚVIDAS:');
console.log('   • Problema comum após mudança de servidor');
console.log('   • Solução é sempre adicionar novo IP');
console.log('   • Execute monitoramento para acompanhar');

console.log('\n🚀 VAMOS CORRIGIR! Execute agora:');
console.log('   node monitorar-whitelist.js');
console.log('');
console.log('='.repeat(60));
