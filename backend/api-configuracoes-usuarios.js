#!/usr/bin/env node

/**
 * 🌐 API DE CONFIGURAÇÕES DE TRADING PERSONALIZADAS
 * 
 * Endpoints para usuários gerenciarem seus parâmetros de trading:
 * - GET /api/trading-config/:userId - Obter configurações
 * - POST /api/trading-config/:userId - Definir configurações
 * - DELETE /api/trading-config/:userId - Resetar para padrão
 * - GET /api/trading-limits/:planType - Obter limites do plano
 */

const express = require('express');
const UserManager = require('./user-manager-v2');

class TradingConfigAPI {
    constructor() {
        this.app = express();
        this.userManager = new UserManager();
        this.port = 3002;
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
    }

    setupRoutes() {
        // Página de configuração para usuários
        this.app.get('/', (req, res) => {
            res.send(this.gerarPaginaConfiguracao());
        });

        // Obter configurações do usuário
        this.app.get('/api/trading-config/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                const config = await this.userManager.obterParametrosTradingUsuario(userId);
                
                res.json({
                    success: true,
                    data: config,
                    message: 'Configurações obtidas com sucesso'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Configurar parâmetros do usuário
        this.app.post('/api/trading-config/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                const parametros = req.body;
                
                const configAplicada = await this.userManager.configurarParametrosTradingUsuario(
                    userId, 
                    parametros
                );
                
                res.json({
                    success: true,
                    data: configAplicada,
                    message: 'Configurações aplicadas com sucesso'
                });
            } catch (error) {
                res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Resetar para configurações padrão
        this.app.delete('/api/trading-config/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                await this.userManager.resetarParametrosUsuario(userId);
                
                const configPadrao = await this.userManager.obterParametrosTradingUsuario(userId);
                
                res.json({
                    success: true,
                    data: configPadrao,
                    message: 'Configurações resetadas para padrão'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Obter limites do plano
        this.app.get('/api/trading-limits/:planType', (req, res) => {
            try {
                const { planType } = req.params;
                const limites = this.obterLimitesPlano(planType);
                
                res.json({
                    success: true,
                    data: limites,
                    message: `Limites do plano ${planType}`
                });
            } catch (error) {
                res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Simular operação com parâmetros
        this.app.post('/api/simulate-trade', (req, res) => {
            try {
                const { price, balance, leverage, stopLoss, takeProfit, positionSize, side } = req.body;
                
                const simulacao = this.simularOperacao({
                    price: parseFloat(price),
                    balance: parseFloat(balance),
                    leverage: parseFloat(leverage),
                    stopLoss: parseFloat(stopLoss),
                    takeProfit: parseFloat(takeProfit),
                    positionSize: parseFloat(positionSize),
                    side: side || 'buy'
                });
                
                res.json({
                    success: true,
                    data: simulacao,
                    message: 'Simulação concluída'
                });
            } catch (error) {
                res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }

    obterLimitesPlano(planType) {
        const limites = {
            'standard': {
                maxLeverage: 5,
                maxStopLoss: 15,
                minStopLoss: 5,
                maxTakeProfit: 25,
                minTakeProfit: 10,
                maxPositionSize: 30,
                allowCustomization: false
            },
            'vip': {
                maxLeverage: 10,
                maxStopLoss: 20,
                minStopLoss: 3,
                maxTakeProfit: 40,
                minTakeProfit: 8,
                maxPositionSize: 50,
                allowCustomization: true
            },
            'premium': {
                maxLeverage: 20,
                maxStopLoss: 25,
                minStopLoss: 2,
                maxTakeProfit: 60,
                minTakeProfit: 5,
                maxPositionSize: 70,
                allowCustomization: true
            },
            'elite': {
                maxLeverage: 50,
                maxStopLoss: 30,
                minStopLoss: 1,
                maxTakeProfit: 100,
                minTakeProfit: 3,
                maxPositionSize: 100,
                allowCustomization: true
            }
        };

        return limites[planType] || limites['standard'];
    }

    simularOperacao(params) {
        const { price, balance, leverage, stopLoss, takeProfit, positionSize, side } = params;
        
        const valorOperacao = (balance * positionSize) / 100;
        const quantidade = valorOperacao / price;
        
        let takeProfitPrice, stopLossPrice;
        
        if (side.toLowerCase() === 'buy') {
            takeProfitPrice = price * (1 + (takeProfit / 100));
            stopLossPrice = price * (1 - (stopLoss / 100));
        } else {
            takeProfitPrice = price * (1 - (takeProfit / 100));
            stopLossPrice = price * (1 + (stopLoss / 100));
        }
        
        const lucroTP = valorOperacao * leverage * (takeProfit / 100);
        const prejuizoSL = valorOperacao * leverage * (stopLoss / 100);
        
        return {
            entryPrice: price,
            quantity: quantidade,
            positionValue: valorOperacao,
            leverage: leverage,
            takeProfitPrice: takeProfitPrice,
            stopLossPrice: stopLossPrice,
            potentialProfit: lucroTP,
            potentialLoss: prejuizoSL,
            riskRewardRatio: lucroTP / prejuizoSL,
            side: side
        };
    }

    gerarPaginaConfiguracao() {
        return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🎛️ Configurações de Trading - CoinBitClub</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                    color: white;
                    min-height: 100vh;
                    padding: 20px;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    background: rgba(255,255,255,0.1);
                    border-radius: 15px;
                    padding: 30px;
                    backdrop-filter: blur(10px);
                }
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                }
                .config-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin-bottom: 30px;
                }
                .config-section {
                    background: rgba(255,255,255,0.05);
                    padding: 25px;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .form-group {
                    margin-bottom: 20px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #e0e0e0;
                }
                .form-control {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 8px;
                    background: rgba(255,255,255,0.1);
                    color: white;
                    font-size: 16px;
                }
                .form-control:focus {
                    outline: none;
                    border-color: #4CAF50;
                    box-shadow: 0 0 10px rgba(76,175,80,0.3);
                }
                .btn {
                    padding: 12px 25px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin: 5px;
                }
                .btn-primary {
                    background: linear-gradient(45deg, #4CAF50, #45a049);
                    color: white;
                }
                .btn-secondary {
                    background: linear-gradient(45deg, #2196F3, #1976D2);
                    color: white;
                }
                .btn-danger {
                    background: linear-gradient(45deg, #f44336, #d32f2f);
                    color: white;
                }
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                }
                .simulation-result {
                    background: rgba(76,175,80,0.1);
                    border: 1px solid #4CAF50;
                    border-radius: 10px;
                    padding: 20px;
                    margin-top: 20px;
                }
                .plan-limits {
                    background: rgba(255,193,7,0.1);
                    border: 1px solid #FFC107;
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                .result-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-top: 15px;
                }
                .result-item {
                    background: rgba(255,255,255,0.05);
                    padding: 10px;
                    border-radius: 5px;
                    text-align: center;
                }
                @media (max-width: 768px) {
                    .config-grid, .result-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎛️ Configurações Personalizadas de Trading</h1>
                    <p>Configure seus parâmetros de trading de acordo com seu perfil de risco</p>
                </div>

                <div class="plan-limits" id="planLimits">
                    <h3>📋 Limites do seu plano</h3>
                    <p>Selecione seu plano para ver os limites disponíveis</p>
                    <select id="planSelect" class="form-control" onchange="loadPlanLimits()">
                        <option value="standard">Standard</option>
                        <option value="vip">VIP</option>
                        <option value="premium">Premium</option>
                        <option value="elite">Elite</option>
                    </select>
                    <div id="planLimitsContent"></div>
                </div>

                <div class="config-grid">
                    <div class="config-section">
                        <h3>⚙️ Configurações de Trading</h3>
                        <form id="tradingConfigForm">
                            <div class="form-group">
                                <label>👤 ID do Usuário:</label>
                                <input type="number" id="userId" class="form-control" value="1" required>
                            </div>
                            
                            <div class="form-group">
                                <label>⚡ Alavancagem:</label>
                                <input type="range" id="leverage" class="form-control" min="1" max="50" value="5" oninput="updateValue('leverage')">
                                <span id="leverageValue">5x</span>
                            </div>
                            
                            <div class="form-group">
                                <label>🔻 Stop Loss (%):</label>
                                <input type="range" id="stopLoss" class="form-control" min="1" max="30" value="10" oninput="updateValue('stopLoss')">
                                <span id="stopLossValue">10%</span>
                            </div>
                            
                            <div class="form-group">
                                <label>🎯 Take Profit (%):</label>
                                <input type="range" id="takeProfit" class="form-control" min="3" max="100" value="15" oninput="updateValue('takeProfit')">
                                <span id="takeProfitValue">15%</span>
                            </div>
                            
                            <div class="form-group">
                                <label>💰 Tamanho da Posição (%):</label>
                                <input type="range" id="positionSize" class="form-control" min="5" max="100" value="30" oninput="updateValue('positionSize')">
                                <span id="positionSizeValue">30%</span>
                            </div>
                            
                            <div class="form-group">
                                <label>🎯 Gestão de Risco:</label>
                                <select id="riskManagement" class="form-control">
                                    <option value="conservative">Conservador</option>
                                    <option value="moderate">Moderado</option>
                                    <option value="aggressive">Agressivo</option>
                                    <option value="expert">Expert</option>
                                </select>
                            </div>
                            
                            <button type="button" class="btn btn-primary" onclick="saveConfig()">💾 Salvar Configurações</button>
                            <button type="button" class="btn btn-secondary" onclick="loadConfig()">📥 Carregar Configurações</button>
                            <button type="button" class="btn btn-danger" onclick="resetConfig()">🔄 Resetar Padrão</button>
                        </form>
                    </div>

                    <div class="config-section">
                        <h3>🧮 Simulador de Operação</h3>
                        <form id="simulationForm">
                            <div class="form-group">
                                <label>💵 Preço de Entrada (USD):</label>
                                <input type="number" id="price" class="form-control" value="50000" step="0.01">
                            </div>
                            
                            <div class="form-group">
                                <label>💰 Saldo da Conta (USD):</label>
                                <input type="number" id="balance" class="form-control" value="1000" step="0.01">
                            </div>
                            
                            <div class="form-group">
                                <label>📊 Direção:</label>
                                <select id="side" class="form-control">
                                    <option value="buy">LONG (Compra)</option>
                                    <option value="sell">SHORT (Venda)</option>
                                </select>
                            </div>
                            
                            <button type="button" class="btn btn-primary" onclick="simulateTrade()">🎯 Simular Operação</button>
                        </form>
                        
                        <div id="simulationResult" class="simulation-result" style="display:none;">
                            <h4>📊 Resultado da Simulação</h4>
                            <div class="result-grid" id="resultGrid"></div>
                        </div>
                    </div>
                </div>
            </div>

            <script>
                function updateValue(field) {
                    const element = document.getElementById(field);
                    const valueElement = document.getElementById(field + 'Value');
                    const suffix = field === 'leverage' ? 'x' : '%';
                    valueElement.textContent = element.value + suffix;
                }

                async function loadPlanLimits() {
                    const planType = document.getElementById('planSelect').value;
                    try {
                        const response = await fetch(\`/api/trading-limits/\${planType}\`);
                        const data = await response.json();
                        
                        if (data.success) {
                            const limits = data.data;
                            document.getElementById('planLimitsContent').innerHTML = \`
                                <div class="result-grid">
                                    <div class="result-item">⚡ Alavancagem: até \${limits.maxLeverage}x</div>
                                    <div class="result-item">🔻 Stop Loss: \${limits.minStopLoss}% - \${limits.maxStopLoss}%</div>
                                    <div class="result-item">🎯 Take Profit: \${limits.minTakeProfit}% - \${limits.maxTakeProfit}%</div>
                                    <div class="result-item">💰 Posição: até \${limits.maxPositionSize}%</div>
                                </div>
                                <p style="margin-top:10px;">🎛️ Personalização: \${limits.allowCustomization ? 'Permitida' : 'Bloqueada'}</p>
                            \`;
                            
                            // Atualizar limites dos sliders
                            document.getElementById('leverage').max = limits.maxLeverage;
                            document.getElementById('stopLoss').max = limits.maxStopLoss;
                            document.getElementById('takeProfit').max = limits.maxTakeProfit;
                            document.getElementById('positionSize').max = limits.maxPositionSize;
                        }
                    } catch (error) {
                        console.error('Erro ao carregar limites:', error);
                    }
                }

                async function saveConfig() {
                    const userId = document.getElementById('userId').value;
                    const config = {
                        leverage: parseInt(document.getElementById('leverage').value),
                        stopLoss: parseInt(document.getElementById('stopLoss').value),
                        takeProfit: parseInt(document.getElementById('takeProfit').value),
                        positionSize: parseInt(document.getElementById('positionSize').value),
                        preferences: {
                            riskManagement: document.getElementById('riskManagement').value
                        }
                    };
                    
                    try {
                        const response = await fetch(\`/api/trading-config/\${userId}\`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(config)
                        });
                        
                        const data = await response.json();
                        if (data.success) {
                            alert('✅ Configurações salvas com sucesso!');
                        } else {
                            alert('❌ Erro: ' + data.error);
                        }
                    } catch (error) {
                        alert('❌ Erro ao salvar: ' + error.message);
                    }
                }

                async function loadConfig() {
                    const userId = document.getElementById('userId').value;
                    
                    try {
                        const response = await fetch(\`/api/trading-config/\${userId}\`);
                        const data = await response.json();
                        
                        if (data.success) {
                            const config = data.data;
                            document.getElementById('leverage').value = config.leverage;
                            document.getElementById('stopLoss').value = config.stopLoss;
                            document.getElementById('takeProfit').value = config.takeProfit;
                            document.getElementById('positionSize').value = config.positionSize;
                            
                            updateValue('leverage');
                            updateValue('stopLoss');
                            updateValue('takeProfit');
                            updateValue('positionSize');
                            
                            alert('✅ Configurações carregadas!');
                        }
                    } catch (error) {
                        alert('❌ Erro ao carregar: ' + error.message);
                    }
                }

                async function resetConfig() {
                    const userId = document.getElementById('userId').value;
                    
                    try {
                        const response = await fetch(\`/api/trading-config/\${userId}\`, {
                            method: 'DELETE'
                        });
                        
                        const data = await response.json();
                        if (data.success) {
                            loadConfig();
                            alert('✅ Configurações resetadas para padrão!');
                        }
                    } catch (error) {
                        alert('❌ Erro ao resetar: ' + error.message);
                    }
                }

                async function simulateTrade() {
                    const params = {
                        price: document.getElementById('price').value,
                        balance: document.getElementById('balance').value,
                        leverage: document.getElementById('leverage').value,
                        stopLoss: document.getElementById('stopLoss').value,
                        takeProfit: document.getElementById('takeProfit').value,
                        positionSize: document.getElementById('positionSize').value,
                        side: document.getElementById('side').value
                    };
                    
                    try {
                        const response = await fetch('/api/simulate-trade', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(params)
                        });
                        
                        const data = await response.json();
                        if (data.success) {
                            const result = data.data;
                            document.getElementById('resultGrid').innerHTML = \`
                                <div class="result-item">💰 Valor Posição: $\${result.positionValue.toFixed(2)}</div>
                                <div class="result-item">📊 Quantidade: \${result.quantity.toFixed(6)}</div>
                                <div class="result-item">🎯 Take Profit: $\${result.takeProfitPrice.toFixed(2)}</div>
                                <div class="result-item">🔻 Stop Loss: $\${result.stopLossPrice.toFixed(2)}</div>
                                <div class="result-item">💵 Lucro Potencial: +$\${result.potentialProfit.toFixed(2)}</div>
                                <div class="result-item">💸 Risco Máximo: -$\${result.potentialLoss.toFixed(2)}</div>
                                <div class="result-item">⚖️ Risco/Retorno: 1:\${result.riskRewardRatio.toFixed(2)}</div>
                                <div class="result-item">📈 Direção: \${result.side.toUpperCase()}</div>
                            \`;
                            document.getElementById('simulationResult').style.display = 'block';
                        }
                    } catch (error) {
                        alert('❌ Erro na simulação: ' + error.message);
                    }
                }

                // Inicializar
                loadPlanLimits();
                loadConfig();
            </script>
        </body>
        </html>
        `;
    }

    async inicializar() {
        await this.userManager.inicializar();
        
        this.app.listen(this.port, () => {
            console.log(`🌐 API de Configurações rodando em http://localhost:${this.port}`);
            console.log('🎛️ Interface disponível em http://localhost:' + this.port);
        });
    }
}

// Inicializar se executado diretamente
if (require.main === module) {
    const api = new TradingConfigAPI();
    api.inicializar().catch(console.error);
}

module.exports = TradingConfigAPI;
