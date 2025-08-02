const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

console.log(`
🔄 VERIFICAÇÃO COMPLETA DO SISTEMA
═══════════════════════════════════════
🎯 Verificando todas as portas e serviços
`);

async function checkAllPorts() {
    try {
        // Verificar todas as portas Node.js ativas
        const { stdout } = await execAsync('netstat -ano | findstr node.exe');
        console.log('🌐 PORTAS ATIVAS COM NODE.JS:');
        console.log(stdout);
        
        // Verificar processos Node específicos
        const { stdout: taskOutput } = await execAsync('tasklist /fi "IMAGENAME eq node.exe" /fo csv');
        const lines = taskOutput.trim().split('\n');
        
        if (lines.length > 1) {
            console.log('\n🔧 PROCESSOS NODE.JS ATIVOS:');
            lines.slice(1).forEach(line => {
                const fields = line.split(',').map(f => f.replace(/"/g, ''));
                console.log(`PID ${fields[1]}: ${fields[4]} de memória`);
            });
        }
        
        // Testar conectividade das portas principais
        const testPorts = [3009, 3010, 3011, 3012, 9001, 9003];
        
        console.log('\n📊 TESTE DE CONECTIVIDADE:');
        for (const port of testPorts) {
            try {
                const { stdout: netstatResult } = await execAsync(`netstat -ano | findstr :${port}`);
                if (netstatResult.trim()) {
                    console.log(`✅ Porta ${port}: ATIVA`);
                    
                    // Identificar serviço
                    const serviceName = {
                        3009: 'Dashboard Principal',
                        3010: 'WebSocket Server',
                        3011: 'Trading System',
                        3012: 'API Indicadores',
                        9001: 'Signal Ingestor',
                        9003: 'Sistema Trading'
                    }[port] || 'Serviço Desconhecido';
                    
                    console.log(`    📋 Serviço: ${serviceName}`);
                } else {
                    console.log(`❌ Porta ${port}: INATIVA`);
                }
            } catch (error) {
                console.log(`❌ Porta ${port}: INATIVA`);
            }
        }
        
        // Sugerir próximos passos
        console.log('\n🔧 PRÓXIMOS PASSOS:');
        console.log('1. Verificar logs de erro dos serviços que falharam');
        console.log('2. Resolver conflitos de porta');
        console.log('3. Reiniciar serviços em portas livres');
        console.log('4. Executar verificação de saúde completa');
        
    } catch (error) {
        console.log('❌ Erro na verificação:', error.message);
    }
}

checkAllPorts();
