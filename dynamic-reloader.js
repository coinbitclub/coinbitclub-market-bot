/**
 * 🔄 SISTEMA DE RECARREGAMENTO DINÂMICO
 * 
 * Módulo para recarregamento automático de usuários e chaves
 * sem necessidade de reiniciar o sistema principal
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class DynamicReloader extends EventEmitter {
    constructor() {
        super();
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });
        
        this.cachedUsers = new Map();
        this.lastCheckTime = Date.now();
        this.isMonitoring = false;
        this.reloadSignalFile = path.join(__dirname, '.reload-signal');
    }

    /**
     * Carrega usuários ativos com suas chaves válidas
     */
    async loadActiveUsers() {
        try {
            const query = `
                SELECT 
                    u.id,
                    u.name,
                    u.email,
                    u.role,
                    u.is_active,
                    uak.id as key_id,
                    uak.api_key,
                    uak.secret_key,
                    uak.exchange,
                    uak.environment,
                    uak.validation_status,
                    uak.is_active as key_active,
                    uak.updated_at
                FROM users u
                JOIN user_api_keys uak ON u.id = uak.user_id
                WHERE u.is_active = true 
                AND uak.is_active = true
                AND uak.validation_status = 'valid'
                ORDER BY u.name, uak.exchange, uak.environment
            `;
            
            const result = await this.pool.query(query);
            
            // Organizar por usuário
            const usersMap = new Map();
            
            result.rows.forEach(row => {
                if (!usersMap.has(row.id)) {
                    usersMap.set(row.id, {
                        id: row.id,
                        name: row.name,
                        email: row.email,
                        role: row.role,
                        is_active: row.is_active,
                        keys: []
                    });
                }
                
                usersMap.get(row.id).keys.push({
                    id: row.key_id,
                    api_key: row.api_key,
                    secret_key: row.secret_key,
                    exchange: row.exchange,
                    environment: row.environment,
                    validation_status: row.validation_status,
                    is_active: row.key_active,
                    updated_at: row.updated_at
                });
            });
            
            return Array.from(usersMap.values());
            
        } catch (error) {
            console.error('❌ Erro ao carregar usuários ativos:', error.message);
            return [];
        }
    }

    /**
     * Detecta mudanças nos usuários e chaves
     */
    async detectChanges() {
        try {
            const currentUsers = await this.loadActiveUsers();
            const changes = {
                newUsers: [],
                updatedUsers: [],
                removedUsers: [],
                hasChanges: false
            };
            
            // Criar mapa dos usuários atuais para comparação
            const currentUserIds = new Set(currentUsers.map(u => u.id));
            const cachedUserIds = new Set(this.cachedUsers.keys());
            
            // Detectar novos usuários
            for (const user of currentUsers) {
                if (!this.cachedUsers.has(user.id)) {
                    changes.newUsers.push(user);
                    changes.hasChanges = true;
                    console.log(`➕ Novo usuário detectado: ${user.name}`);
                } else {
                    // Verificar se houve mudanças nas chaves
                    const cachedUser = this.cachedUsers.get(user.id);
                    const currentKeyIds = user.keys.map(k => k.id).sort();
                    const cachedKeyIds = cachedUser.keys.map(k => k.id).sort();
                    
                    if (JSON.stringify(currentKeyIds) !== JSON.stringify(cachedKeyIds)) {
                        changes.updatedUsers.push(user);
                        changes.hasChanges = true;
                        console.log(`🔄 Chaves atualizadas para: ${user.name}`);
                    }
                }
            }
            
            // Detectar usuários removidos (desativados)
            for (const cachedUserId of cachedUserIds) {
                if (!currentUserIds.has(cachedUserId)) {
                    const cachedUser = this.cachedUsers.get(cachedUserId);
                    changes.removedUsers.push(cachedUser);
                    changes.hasChanges = true;
                    console.log(`➖ Usuário removido/desativado: ${cachedUser.name}`);
                }
            }
            
            return changes;
            
        } catch (error) {
            console.error('❌ Erro ao detectar mudanças:', error.message);
            return { hasChanges: false };
        }
    }

    /**
     * Atualiza cache interno dos usuários
     */
    updateCache(users) {
        this.cachedUsers.clear();
        users.forEach(user => {
            this.cachedUsers.set(user.id, user);
        });
        this.lastCheckTime = Date.now();
        console.log(`💾 Cache atualizado: ${users.length} usuário(s) ativo(s)`);
    }

    /**
     * Verifica sinal de recarregamento manual
     */
    checkReloadSignal() {
        try {
            if (fs.existsSync(this.reloadSignalFile)) {
                const signal = JSON.parse(fs.readFileSync(this.reloadSignalFile, 'utf8'));
                
                // Verificar se o sinal é mais recente que a última verificação
                if (signal.timestamp > this.lastCheckTime) {
                    console.log(`🔔 Sinal de recarregamento detectado: ${signal.reason}`);
                    
                    // Remover arquivo de sinal
                    fs.unlinkSync(this.reloadSignalFile);
                    
                    return true;
                }
            }
        } catch (error) {
            // Ignora erros de sinal - não crítico
        }
        
        return false;
    }

    /**
     * Executa verificação completa e recarregamento se necessário
     */
    async checkAndReload() {
        try {
            const signalDetected = this.checkReloadSignal();
            const changes = await this.detectChanges();
            
            if (signalDetected || changes.hasChanges) {
                console.log('🔄 Mudanças detectadas - iniciando recarregamento...');
                
                // Carregar usuários atualizados
                const newUsers = await this.loadActiveUsers();
                
                // Atualizar cache
                this.updateCache(newUsers);
                
                // Emitir evento de recarregamento
                this.emit('usersReloaded', {
                    users: newUsers,
                    changes: changes,
                    timestamp: Date.now()
                });
                
                console.log('✅ Recarregamento concluído!');
                console.log(`📊 Total de usuários ativos: ${newUsers.length}`);
                
                return { reloaded: true, users: newUsers, changes };
            }
            
            return { reloaded: false, users: Array.from(this.cachedUsers.values()) };
            
        } catch (error) {
            console.error('❌ Erro na verificação e recarregamento:', error.message);
            return { reloaded: false, error: error.message };
        }
    }

    /**
     * Inicia monitoramento automático
     */
    startMonitoring(intervalSeconds = 30) {
        if (this.isMonitoring) {
            console.log('ℹ️ Monitoramento já está ativo');
            return;
        }
        
        console.log(`🔄 Iniciando monitoramento dinâmico (${intervalSeconds}s)`);
        this.isMonitoring = true;
        
        // Carregar usuários iniciais
        this.checkAndReload();
        
        // Configurar intervalo de verificação
        this.monitoringInterval = setInterval(async () => {
            await this.checkAndReload();
        }, intervalSeconds * 1000);
        
        console.log('✅ Monitoramento dinâmico ativo!');
    }

    /**
     * Para o monitoramento
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        console.log('⏹️ Monitoramento dinâmico parado');
    }

    /**
     * Força recarregamento manual
     */
    async forceReload() {
        console.log('🔄 Forçando recarregamento manual...');
        return await this.checkAndReload();
    }

    /**
     * Obtém usuários ativos do cache
     */
    getActiveUsers() {
        return Array.from(this.cachedUsers.values());
    }

    /**
     * Obtém estatísticas do sistema
     */
    getStats() {
        const users = this.getActiveUsers();
        const totalKeys = users.reduce((sum, user) => sum + user.keys.length, 0);
        const exchangeCount = {};
        
        users.forEach(user => {
            user.keys.forEach(key => {
                exchangeCount[key.exchange] = (exchangeCount[key.exchange] || 0) + 1;
            });
        });
        
        return {
            totalUsers: users.length,
            totalKeys: totalKeys,
            exchangeDistribution: exchangeCount,
            lastUpdate: this.lastCheckTime,
            isMonitoring: this.isMonitoring
        };
    }

    /**
     * Fecha conexões e limpa recursos
     */
    async close() {
        this.stopMonitoring();
        await this.pool.end();
        this.removeAllListeners();
        console.log('🔒 Sistema de recarregamento dinâmico fechado');
    }
}

// Função para integração fácil
function createDynamicReloader() {
    return new DynamicReloader();
}

// Função para trigger manual de recarregamento
function triggerReload(reason = 'manual') {
    const reloadSignalFile = path.join(__dirname, '.reload-signal');
    fs.writeFileSync(reloadSignalFile, JSON.stringify({
        timestamp: Date.now(),
        reason: reason
    }));
    console.log(`📢 Sinal de recarregamento enviado: ${reason}`);
}

module.exports = {
    DynamicReloader,
    createDynamicReloader,
    triggerReload
};

// Se executado diretamente, demonstrar funcionalidade
if (require.main === module) {
    console.log('🔄 SISTEMA DE RECARREGAMENTO DINÂMICO');
    console.log('====================================');
    
    const reloader = new DynamicReloader();
    
    // Listener para mudanças
    reloader.on('usersReloaded', (data) => {
        console.log('\n🔔 EVENTO: Usuários recarregados!');
        console.log(`📊 Total: ${data.users.length} usuário(s)`);
        console.log(`🆕 Novos: ${data.changes.newUsers.length}`);
        console.log(`🔄 Atualizados: ${data.changes.updatedUsers.length}`);
        console.log(`➖ Removidos: ${data.changes.removedUsers.length}`);
        console.log('');
    });
    
    // Iniciar monitoramento
    reloader.startMonitoring(10); // 10 segundos para demo
    
    console.log('✅ Sistema iniciado! Monitoreando mudanças...');
    console.log('💡 Para testar, adicione/remova usuários ou chaves no banco');
    console.log('Press Ctrl+C para parar...');
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n⏹️ Encerrando sistema...');
        await reloader.close();
        process.exit(0);
    });
}
