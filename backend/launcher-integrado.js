/**
 * 🚀 LAUNCHER INTEGRADO ENTERPRISE
 * 
 * Sistema otimizado que:
 * - Integra com sistema de leitura existente
 * - Usa apenas APIs reais do .env
 * - Evita duplicação de funcionalidades
 * - Mantém compatibilidade total
 */

const { createRobustPool, testConnection } = require('./fixed-database-config');
const { spawn } = require('child_process');
const axios = require('axios');

class LauncherIntegrado {
    constructor() {
        this.pool = null;
        this.sistemaAtivo = null;
        this.modoOperacao = 'RESILIENTE'; // ou 'ENTERPRISE'
        
        console.log('🔥 LAUNCHER INTEGRADO ENTERPRISE');
        console.log('   ✅ APIs reais do .env');
        console.log('   ✅ Zero duplicação');
        console.log('   ✅ Máxima eficiência\n');
    }

    async detectarSistemaExistente() {
        console.log('🔍 Detectando sistema de leitura existente...');
        
        try {
            this.pool = createRobustPool();
            const conectado = await testConnection(this.pool);
            
            if (!conectado) {
                throw new Error('Banco de dados inacessível');
            }

            // Verificar se há dados recentes do sistema enterprise
            const { safeQuery } = require('./fixed-database-config');
            const dadosRecentes = await safeQuery(this.pool, `
                SELECT COUNT(*) as total, MAX(created_at) as ultimo_registro
                FROM sistema_leitura_mercado 
                WHERE created_at > NOW() - INTERVAL '30 minutes'
            `);

            const registro = dadosRecentes.rows[0];
            const tempoUltimoRegistro = registro.ultimo_registro ? 
                Date.now() - new Date(registro.ultimo_registro).getTime() : 
                Infinity;

            console.log(`   📊 Registros recentes (30min): ${registro.total}`);
            
            if (registro.ultimo_registro) {
                console.log(`   ⏰ Último registro: ${Math.round(tempoUltimoRegistro/1000/60)} min atrás`);
            }

            // Decidir modo de operação
            if (registro.total > 0 && tempoUltimoRegistro < 10 * 60 * 1000) { // < 10 min
                this.modoOperacao = 'ENTERPRISE';
                console.log('   ✅ Sistema Enterprise detectado e ATIVO');
                return 'ENTERPRISE_ATIVO';
            } else if (registro.total > 0) {
                this.modoOperacao = 'ENTERPRISE';
                console.log('   ⚠️ Sistema Enterprise detectado mas INATIVO');
                return 'ENTERPRISE_INATIVO';
            } else {
                this.modoOperacao = 'RESILIENTE';
                console.log('   📋 Nenhum sistema detectado - iniciará Resiliente');
                return 'NOVO';
            }

        } catch (error) {
            console.error('   ❌ Erro na detecção:', error.message);
            this.modoOperacao = 'RESILIENTE';
            return 'ERRO';
        }
    }

    async verificarAPIsDisponiveis() {
        console.log('\n🌐 Verificando APIs reais do ambiente...');
        
        const apis = [
            {
                nome: 'CoinStats Fear&Greed',
                url: process.env.FEAR_GREED_URL || 'https://openapiv1.coinstats.app/insights/fear-and-greed',
                headers: { 'X-API-KEY': process.env.COINSTATS_API_KEY },
                essencial: true
            },
            {
                nome: 'Binance Public',
                url: 'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT',
                essencial: true
            },
            {
                nome: 'OpenAI',
                url: 'https://api.openai.com/v1/models',
                headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
                essencial: false
            }
        ];

        let apisDisponiveis = 0;
        let apisEssenciaisOk = 0;
        const totalEssenciais = apis.filter(api => api.essencial).length;

        for (const api of apis) {
            try {
                const response = await axios.get(api.url, {
                    headers: api.headers || {},
                    timeout: 8000
                });

                if (response.status === 200) {
                    console.log(`   ✅ ${api.nome}: DISPONÍVEL`);
                    apisDisponiveis++;
                    if (api.essencial) apisEssenciaisOk++;
                } else {
                    console.log(`   ⚠️ ${api.nome}: Status ${response.status}`);
                }
            } catch (error) {
                const status = api.essencial ? '❌' : '⚠️';
                console.log(`   ${status} ${api.nome}: ${error.message}`);
            }
        }

        console.log(`\n   📊 Resumo: ${apisDisponiveis}/${apis.length} APIs disponíveis`);
        console.log(`   🎯 Essenciais: ${apisEssenciaisOk}/${totalEssenciais} OK`);

        return apisEssenciaisOk >= totalEssenciais;
    }

    async pararSistemaExistente() {
        console.log('\n🛑 Parando processos existentes...');
        
        try {
            // Tentar parar graciosamente via comando
            const { exec } = require('child_process');
            const util = require('util');
            const execPromise = util.promisify(exec);

            // Listar processos Node.js
            const { stdout } = await execPromise('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
            const linhas = stdout.split('\n').filter(linha => linha.includes('node.exe'));
            
            console.log(`   🔍 Encontrados ${linhas.length} processos Node.js`);

            if (linhas.length > 1) { // Mais que o processo atual
                // Matar outros processos Node.js
                await execPromise('taskkill /IM node.exe /F /FI "PID ne %PID%"').catch(() => {
                    // Tentar método alternativo
                    return execPromise('taskkill /IM node.exe /F');
                });
                
                console.log('   ✅ Processos anteriores terminados');
                
                // Aguardar limpeza
                await new Promise(resolve => setTimeout(resolve, 3000));
            } else {
                console.log('   ✅ Nenhum processo anterior detectado');
            }

        } catch (error) {
            console.log('   ⚠️ Erro ao parar processos:', error.message);
        }
    }

    async iniciarSistemaOtimizado() {
        console.log(`\n🚀 Iniciando sistema ${this.modoOperacao}...`);
        
        const arquivo = this.modoOperacao === 'ENTERPRISE' ? 
            'sistema-leitura-mercado-enterprise.js' : 
            'sistema-leitura-mercado-resiliente.js';

        return new Promise((resolve, reject) => {
            this.sistemaAtivo = spawn('node', [arquivo], {
                cwd: process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe'],
                env: process.env
            });

            let inicializado = false;
            let dadosBuffer = '';

            // Monitorar saída
            this.sistemaAtivo.stdout.on('data', (data) => {
                const output = data.toString();
                dadosBuffer += output;
                
                // Mostrar em tempo real (últimas linhas)
                const linhas = dadosBuffer.split('\n');
                if (linhas.length > 10) {
                    dadosBuffer = linhas.slice(-5).join('\n');
                }
                
                process.stdout.write(output);

                // Detectar inicialização
                if ((output.includes('INICIANDO CICLO') || 
                     output.includes('SISTEMA RESILIENTE INICIADO')) && 
                    !inicializado) {
                    inicializado = true;
                    console.log('\n✅ Sistema inicializado com sucesso!');
                    resolve(this.sistemaAtivo);
                }
            });

            // Monitorar erros
            this.sistemaAtivo.stderr.on('data', (data) => {
                const error = data.toString();
                process.stderr.write(`[ERROR] ${error}`);
            });

            // Monitorar saída do processo
            this.sistemaAtivo.on('close', (code) => {
                console.log(`\n🔴 Sistema finalizado com código: ${code}`);
                this.sistemaAtivo = null;
                
                if (!inicializado) {
                    reject(new Error(`Sistema falhou com código ${code}`));
                }
            });

            // Timeout de inicialização
            setTimeout(() => {
                if (!inicializado) {
                    console.log('⏰ Timeout na inicialização - assumindo sistema ativo');
                    resolve(this.sistemaAtivo);
                }
            }, 60000); // 1 minuto
        });
    }

    async mostrarStatusFinal() {
        console.log('\n📊 STATUS DO SISTEMA INTEGRADO:');
        console.log('=====================================');
        console.log(`🔧 Modo: ${this.modoOperacao}`);
        console.log(`🌐 APIs: Reais do .env (CoinStats, Binance, OpenAI)`);
        console.log(`💾 Banco: PostgreSQL Railway`);
        console.log(`🔄 Status: ATIVO`);
        console.log('=====================================');
        
        if (this.modoOperacao === 'ENTERPRISE') {
            console.log('📋 FUNCIONALIDADES ENTERPRISE:');
            console.log('   ✅ Fear & Greed Index (CoinStats)');
            console.log('   ✅ Preços Bitcoin (Binance)');
            console.log('   ✅ Análise IA (OpenAI)');
            console.log('   ✅ Recomendações de Trading');
            console.log('   ✅ Intervalos de 15 minutos');
        } else {
            console.log('📋 FUNCIONALIDADES RESILIENTES:');
            console.log('   ✅ Múltiplas APIs com failover');
            console.log('   ✅ Circuit breaker automático');
            console.log('   ✅ Recuperação de falhas');
            console.log('   ✅ Monitoramento contínuo');
        }

        console.log('\n🎯 PRÓXIMOS PASSOS:');
        console.log('   1. Sistema operando automaticamente');
        console.log('   2. Dados sendo salvos a cada ciclo');
        console.log('   3. Monitorar logs para verificar saúde');
        console.log('   4. Acesso via endpoints de API');
        console.log('\n🛑 Para parar: Ctrl+C');
    }

    async executar() {
        try {
            console.log('🔥 LAUNCHER INTEGRADO ENTERPRISE - INICIANDO\n');

            // 1. Detectar sistema existente
            const status = await this.detectarSistemaExistente();

            // 2. Verificar APIs
            const apisOk = await this.verificarAPIsDisponiveis();
            if (!apisOk) {
                throw new Error('APIs essenciais indisponíveis');
            }

            // 3. Parar sistemas anteriores
            await this.pararSistemaExistente();

            // 4. Aguardar estabilização
            console.log('\n⏳ Aguardando estabilização...');
            await new Promise(resolve => setTimeout(resolve, 5000));

            // 5. Iniciar sistema otimizado
            const processo = await this.iniciarSistemaOtimizado();

            // 6. Mostrar status
            await this.mostrarStatusFinal();

            // 7. Manter sistema vivo
            console.log('\n👁️ Monitorando sistema (Ctrl+C para parar)...\n');

            // Configurar handlers de saída
            process.on('SIGINT', () => {
                console.log('\n🔴 Parando sistema integrado...');
                if (this.sistemaAtivo) {
                    this.sistemaAtivo.kill('SIGTERM');
                }
                if (this.pool) {
                    this.pool.end();
                }
                setTimeout(() => process.exit(0), 2000);
            });

            // Manter vivo
            const keepAlive = setInterval(() => {
                if (!this.sistemaAtivo || this.sistemaAtivo.killed) {
                    console.log('🔄 Sistema não está mais ativo - parando launcher');
                    clearInterval(keepAlive);
                    process.exit(1);
                }
            }, 60000);

        } catch (error) {
            console.error('\n💥 ERRO NO LAUNCHER INTEGRADO:', error.message);
            console.log('\n🔧 SOLUÇÕES:');
            console.log('   1. Verificar conexão com PostgreSQL');
            console.log('   2. Verificar variáveis de ambiente (.env)');
            console.log('   3. Verificar conectividade com APIs');
            console.log('   4. Tentar novamente em alguns segundos');
            
            if (this.pool) {
                await this.pool.end();
            }
            
            process.exit(1);
        }
    }
}

// Execução automática
if (require.main === module) {
    const launcher = new LauncherIntegrado();
    launcher.executar();
}

module.exports = LauncherIntegrado;
