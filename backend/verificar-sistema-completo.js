#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

console.log(`
🔍 ANÁLISE COMPLETA DO SISTEMA
═══════════════════════════════════════
🎯 Verificando todos os componentes ativos
📊 Status de portas, processos e serviços
`);

class SystemAnalyzer {
    constructor() {
        this.ports = [3009, 3010, 3011, 3012, 8080, 8081, 8082];
        this.services = [];
    }

    async analyzePort(port) {
        try {
            const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
            const lines = stdout.trim().split('\n').filter(line => line.trim());
            
            if (lines.length > 0) {
                for (const line of lines) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 5 && parts[3] === 'LISTENING') {
                        const pid = parts[4];
                        
                        try {
                            const { stdout: taskOutput } = await execAsync(`tasklist /fi "PID eq ${pid}" /fo csv`);
                            const lines = taskOutput.trim().split('\n');
                            if (lines.length > 1) {
                                const fields = lines[1].split(',').map(f => f.replace(/"/g, ''));
                                const processName = fields[0];
                                const memUsage = fields[4];
                                
                                return {
                                    port,
                                    pid,
                                    processName,
                                    memUsage,
                                    status: 'ATIVO'
                                };
                            }
                        } catch (taskError) {
                            return {
                                port,
                                pid,
                                processName: 'DESCONHECIDO',
                                memUsage: 'N/A',
                                status: 'ATIVO'
                            };
                        }
                    }
                }
            }
            
            return {
                port,
                pid: null,
                processName: null,
                memUsage: null,
                status: 'INATIVO'
            };
            
        } catch (error) {
            return {
                port,
                pid: null,
                processName: null,
                memUsage: null,
                status: 'INATIVO'
            };
        }
    }

    async analyzeAllPorts() {
        console.log('🔍 Analisando portas...\n');
        
        const portPromises = this.ports.map(port => this.analyzePort(port));
        const results = await Promise.all(portPromises);
        
        const activeServices = results.filter(r => r.status === 'ATIVO');
        const inactiveServices = results.filter(r => r.status === 'INATIVO');
        
        console.log('🟢 SERVIÇOS ATIVOS:');
        console.log('═══════════════════════════════════════');
        if (activeServices.length > 0) {
            activeServices.forEach(service => {
                const serviceName = this.getServiceName(service.port);
                console.log(`📊 Porta ${service.port}: ${serviceName}`);
                console.log(`   PID: ${service.pid}`);
                console.log(`   Processo: ${service.processName}`);
                console.log(`   Memória: ${service.memUsage}`);
                console.log(`   Status: ✅ RODANDO`);
                console.log('');
            });
        } else {
            console.log('❌ Nenhum serviço ativo encontrado nas portas monitoradas\n');
        }
        
        console.log('🔴 SERVIÇOS INATIVOS:');
        console.log('═══════════════════════════════════════');
        if (inactiveServices.length > 0) {
            inactiveServices.forEach(service => {
                const serviceName = this.getServiceName(service.port);
                console.log(`📊 Porta ${service.port}: ${serviceName}`);
                console.log(`   Status: ❌ PARADO`);
                console.log('');
            });
        } else {
            console.log('✅ Todos os serviços monitorados estão ativos\n');
        }
        
        return { activeServices, inactiveServices };
    }

    getServiceName(port) {
        const serviceMap = {
            3009: '📊 Dashboard Principal',
            3010: '🌐 Servidor WebSocket',
            3011: '📈 API Trading',
            3012: '📊 API Indicadores',
            8080: '🔄 Proxy Backend',
            8081: '⚡ API Gateway',
            8082: '🎯 Load Balancer'
        };
        
        return serviceMap[port] || '❓ Serviço Desconhecido';
    }

    async checkDatabase() {
        console.log('🗄️ VERIFICANDO CONEXÃO COM BANCO DE DADOS');
        console.log('═══════════════════════════════════════');
        
        try {
            const testScript = `
const { Pool } = require('pg');

const pool = new Pool({
    host: 'maglev.proxy.rlwy.net',
    port: 42095,
    database: 'railway',
    user: 'postgres',
    password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv',
    ssl: { rejectUnauthorized: false }
});

async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT COUNT(*) as users FROM users');
        const users = result.rows[0].users;
        
        const balanceResult = await client.query('SELECT COUNT(*) as balances FROM user_balances');
        const balances = balanceResult.rows[0].balances;
        
        const operationsResult = await client.query('SELECT COUNT(*) as operations FROM operations');
        const operations = operationsResult.rows[0].operations;
        
        const signalsResult = await client.query('SELECT COUNT(*) as signals FROM signals');
        const signals = signalsResult.rows[0].signals;
        
        client.release();
        
        console.log('✅ Conexão com banco: SUCESSO');
        console.log('📊 Usuários cadastrados:', users);
        console.log('💰 Saldos registrados:', balances);
        console.log('📈 Operações:', operations);
        console.log('📡 Sinais:', signals);
        
        process.exit(0);
    } catch (error) {
        console.log('❌ Erro na conexão:', error.message);
        process.exit(1);
    }
}

testConnection();
            `;
            
            // Escrever script temporário
            const fs = require('fs');
            const tempFile = 'temp_db_test.js';
            fs.writeFileSync(tempFile, testScript);
            
            // Executar teste
            const { stdout, stderr } = await execAsync(`node ${tempFile}`);
            console.log(stdout);
            
            // Limpar arquivo temporário
            fs.unlinkSync(tempFile);
            
        } catch (error) {
            console.log('❌ Erro ao testar banco de dados:', error.message);
        }
        
        console.log('');
    }

    async generateSystemReport() {
        console.log('📋 GERANDO RELATÓRIO COMPLETO DO SISTEMA');
        console.log('═══════════════════════════════════════');
        
        const { activeServices, inactiveServices } = await this.analyzeAllPorts();
        await this.checkDatabase();
        
        // Resumo final
        console.log('📊 RESUMO EXECUTIVO:');
        console.log('═══════════════════════════════════════');
        console.log(`🟢 Serviços Ativos: ${activeServices.length}`);
        console.log(`🔴 Serviços Inativos: ${inactiveServices.length}`);
        console.log(`📊 Total Monitorado: ${this.ports.length}`);
        
        const healthPercentage = (activeServices.length / this.ports.length * 100).toFixed(1);
        console.log(`🎯 Saúde do Sistema: ${healthPercentage}%`);
        
        if (healthPercentage >= 80) {
            console.log('✅ Sistema operando normalmente');
        } else if (healthPercentage >= 50) {
            console.log('⚠️ Sistema com problemas menores');
        } else {
            console.log('❌ Sistema com problemas críticos');
        }
        
        console.log('');
        console.log('🔧 AÇÕES RECOMENDADAS:');
        console.log('═══════════════════════════════════════');
        
        if (inactiveServices.length > 0) {
            console.log('1. Iniciar serviços inativos:');
            inactiveServices.forEach(service => {
                console.log(`   node gestor-universal.js start ${this.getComponentId(service.port)}`);
            });
        }
        
        if (activeServices.some(s => s.port === 3009)) {
            console.log('2. ✅ Dashboard já disponível em: http://localhost:3009');
        } else {
            console.log('2. ❌ Iniciar dashboard: node gestor-universal.js start dashboard');
        }
        
        console.log('3. 🔄 Monitoramento contínuo: node gestor-universal.js health');
        console.log('');
    }

    getComponentId(port) {
        const componentMap = {
            3009: 'dashboard',
            3010: 'websocket',
            3011: 'trading',
            3012: 'indicators'
        };
        
        return componentMap[port] || 'unknown';
    }
}

// Executar análise
async function main() {
    const analyzer = new SystemAnalyzer();
    await analyzer.generateSystemReport();
}

main().catch(console.error);
