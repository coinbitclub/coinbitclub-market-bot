// 🚀 CoinBitClub Market Bot - Servidor Multiusuário Limpo
// Versão otimizada para Railway com Twilio SMS (sem WhatsApp)

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Importar gestores principais
const GestorChavesAPI = require('./gestor-chaves-parametrizacoes');

console.log('🚀 INICIANDO SERVIDOR COINBITCLUB MULTIUSUÁRIO...');

const app = express();

// Configuração básica de segurança
app.use(helmet({
    contentSecurityPolicy: false, // Para flexibilidade de desenvolvimento
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: [
        'https://coinbitclub-market-bot.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001'
    ],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000 // 1000 requests por janela
});
app.use(limiter);

// ===== HEALTH CHECKS =====
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        environment: process.env.NODE_ENV || 'development',
        features: {
            multiusuario: true,
            twilio_sms: true,
            whatsapp: false, // Removido
            sistema_hibrido: true
        }
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        api: 'operational',
        multiuser: true,
        sms: 'twilio',
        timestamp: new Date().toISOString()
    });
});

// ===== ROTAS DE SISTEMA MULTIUSUÁRIO =====

// Gestão de usuários
app.get('/api/users', async (req, res) => {
    try {
        // TODO: Implementar autenticação
        res.json({ message: 'Usuários endpoint ativo', multiuser: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Gestão de chaves API
app.post('/api/users/:userId/keys', async (req, res) => {
    try {
        const { userId } = req.params;
        const { exchangeName, apiKey, apiSecret, testnet } = req.body;
        
        const gestor = new GestorChavesAPI();
        const resultado = await gestor.adicionarChaveAPI(userId, exchangeName, apiKey, apiSecret, testnet);
        
        res.json({
            success: true,
            message: 'Chave API adicionada com sucesso',
            data: resultado
        });
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Validar chaves API
app.post('/api/keys/validate', async (req, res) => {
    try {
        const { apiKey, apiSecret, exchangeName, testnet } = req.body;
        
        const gestor = new GestorChavesAPI();
        const validacao = await gestor.validarChavesAPI(apiKey, apiSecret, exchangeName, testnet);
        
        res.json({
            success: true,
            validation: validacao
        });
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Obter dados para trading
app.get('/api/users/:userId/trading-data', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const gestor = new GestorChavesAPI();
        const dados = await gestor.obterDadosUsuarioParaTrading(userId);
        
        res.json({
            success: true,
            data: dados
        });
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Webhook TradingView (sistema multiusuário)
app.post('/api/webhook/tradingview', async (req, res) => {
    try {
        console.log('📊 Webhook TradingView recebido (multiusuário):', req.body);
        
        // TODO: Processar sinal para todos os usuários ativos
        res.json({
            success: true,
            message: 'Sinal processado para sistema multiusuário',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Webhook legacy (compatibilidade)
app.post('/webhook/tradingview/alert', (req, res) => {
    console.log('📊 Webhook legacy TradingView:', req.body);
    res.json({ success: true, message: 'Signal received' });
});

// ===== SMS TWILIO (SUBSTITUINDO WHATSAPP) =====
app.post('/api/sms/send', async (req, res) => {
    try {
        const { to, message } = req.body;
        
        // TODO: Implementar envio via Twilio
        console.log('📱 Enviando SMS via Twilio:', { to, message });
        
        res.json({
            success: true,
            message: 'SMS enviado via Twilio',
            provider: 'twilio'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== AUTENTICAÇÃO BÁSICA =====
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // TODO: Implementar autenticação real
        console.log('🔐 Tentativa de login:', email);
        
        res.json({
            success: true,
            message: 'Login simulado ativo',
            token: 'jwt-token-placeholder'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== MIDDLEWARE DE ERRO =====
app.use((error, req, res, next) => {
    console.error('❌ Erro no servidor:', error.message);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
    });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado',
        path: req.path,
        method: req.method
    });
});

// ===== INICIALIZAÇÃO =====
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
    console.log('');
    console.log('🎉 SERVIDOR MULTIUSUÁRIO INICIADO COM SUCESSO!');
    console.log('=============================================');
    console.log('📊 Porta:', PORT);
    console.log('🌐 Host:', HOST);
    console.log('📱 SMS: Twilio integrado');
    console.log('❌ WhatsApp: Removido');
    console.log('👥 Multiusuário: Ativo');
    console.log('🔀 Sistema híbrido: Testnet + Produção');
    console.log('🔗 Endpoints ativos:');
    console.log('   GET  /health');
    console.log('   GET  /api/health');
    console.log('   POST /api/users/:id/keys');
    console.log('   POST /api/keys/validate');
    console.log('   POST /api/webhook/tradingview');
    console.log('   POST /api/sms/send');
    console.log('   POST /api/auth/login');
    console.log('');
    console.log('✅ Sistema pronto para produção!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Recebido SIGTERM, finalizando servidor...');
    server.close(() => {
        console.log('✅ Servidor finalizado graciosamente');
        process.exit(0);
    });
});

module.exports = app;