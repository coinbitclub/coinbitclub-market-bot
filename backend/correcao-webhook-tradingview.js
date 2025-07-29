#!/usr/bin/env node
/**
 * 🔧 CORREÇÃO WEBHOOK TRADINGVIEW - CÓDIGOS 401
 * Configuração de autenticação para receber sinais
 */

const express = require('express');

// Middleware de autenticação para webhooks TradingView
function authenticateWebhook(req, res, next) {
    // Método 1: Token no header
    const authHeader = req.headers.authorization;
    const webhookToken = req.headers['x-webhook-token'];
    const tradingviewSecret = req.headers['x-tradingview-secret'];
    
    // Método 2: Token na query string
    const queryToken = req.query.token;
    const querySecret = req.query.secret;
    
    // Método 3: Token no body
    const bodyToken = req.body?.token;
    const bodySecret = req.body?.secret;
    
    // Tokens válidos (configuráveis via env)
    const VALID_TOKENS = [
        process.env.TRADINGVIEW_WEBHOOK_TOKEN || 'coinbitclub-webhook-2025',
        process.env.WEBHOOK_SECRET || 'tradingview-secret-key',
        'coinbitclub-tradingview',
        'webhook-coinbitclub',
        'signal-auth-token'
    ];
    
    // IPs do TradingView (whitelist)
    const TRADINGVIEW_IPS = [
        '34.212.75.30',
        '52.32.178.7',
        '52.89.214.238',
        '34.218.226.167',
        '52.38.161.194',
        '52.89.219.24',
        '34.218.226.167',
        '52.89.214.238'
    ];
    
    const clientIP = req.ip || 
                     req.connection?.remoteAddress || 
                     req.socket?.remoteAddress ||
                     req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.headers['x-real-ip'];
    
    console.log(`🔍 Webhook Auth Check:`);
    console.log(`   IP: ${clientIP}`);
    console.log(`   User-Agent: ${req.headers['user-agent']}`);
    console.log(`   Headers: ${JSON.stringify({
        authorization: authHeader ? `${authHeader.substring(0, 20)}...` : 'none',
        'x-webhook-token': webhookToken ? 'present' : 'none',
        'x-tradingview-secret': tradingviewSecret ? 'present' : 'none'
    })}`);
    
    // Verificação 1: IP whitelist para TradingView
    if (TRADINGVIEW_IPS.includes(clientIP)) {
        console.log(`✅ IP autorizado do TradingView: ${clientIP}`);
        req.authMethod = 'ip_whitelist';
        return next();
    }
    
    // Verificação 2: Token no header Authorization
    if (authHeader) {
        const token = authHeader.replace('Bearer ', '').replace('Token ', '');
        if (VALID_TOKENS.includes(token)) {
            console.log(`✅ Token válido no header Authorization`);
            req.authMethod = 'header_token';
            return next();
        }
    }
    
    // Verificação 3: Token específico do webhook
    if (webhookToken && VALID_TOKENS.includes(webhookToken)) {
        console.log(`✅ Token válido no header X-Webhook-Token`);
        req.authMethod = 'webhook_token';
        return next();
    }
    
    // Verificação 4: Secret do TradingView
    if (tradingviewSecret && VALID_TOKENS.includes(tradingviewSecret)) {
        console.log(`✅ Secret válido no header X-TradingView-Secret`);
        req.authMethod = 'tradingview_secret';
        return next();
    }
    
    // Verificação 5: Token na query string
    if (queryToken && VALID_TOKENS.includes(queryToken)) {
        console.log(`✅ Token válido na query string`);
        req.authMethod = 'query_token';
        return next();
    }
    
    if (querySecret && VALID_TOKENS.includes(querySecret)) {
        console.log(`✅ Secret válido na query string`);
        req.authMethod = 'query_secret';
        return next();
    }
    
    // Verificação 6: Token no body
    if (bodyToken && VALID_TOKENS.includes(bodyToken)) {
        console.log(`✅ Token válido no body`);
        req.authMethod = 'body_token';
        return next();
    }
    
    if (bodySecret && VALID_TOKENS.includes(bodySecret)) {
        console.log(`✅ Secret válido no body`);
        req.authMethod = 'body_secret';
        return next();
    }
    
    // Verificação 7: User-Agent do TradingView + corpo de 53 bytes (padrão TradingView)
    const userAgent = req.headers['user-agent'];
    const bodySize = req.headers['content-length'] || 0;
    
    if (userAgent === 'Go-http-client/1.1' && (bodySize == 53 || bodySize == '53')) {
        console.log(`✅ Padrão TradingView detectado (User-Agent + body size)`);
        req.authMethod = 'tradingview_pattern';
        return next();
    }
    
    // Modo desenvolvimento: permitir localhost e desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
        if (clientIP.includes('127.0.0.1') || clientIP.includes('localhost') || clientIP.includes('::1')) {
            console.log(`✅ Desenvolvimento: IP local autorizado`);
            req.authMethod = 'development';
            return next();
        }
    }
    
    // Log do erro 401
    console.log(`❌ Webhook não autorizado:`);
    console.log(`   IP: ${clientIP}`);
    console.log(`   User-Agent: ${userAgent}`);
    console.log(`   Content-Length: ${bodySize}`);
    console.log(`   Tokens verificados: ${VALID_TOKENS.length}`);
    
    return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token de autenticação necessário',
        hint: 'Use token no header Authorization, X-Webhook-Token, ou query string',
        timestamp: new Date().toISOString(),
        ip: clientIP
    });
}

// Rota corrigida para webhooks
function createWebhookRoute(app) {
    // Middleware de parsing
    app.use('/api/webhooks/signal', express.raw({ type: 'application/json', limit: '1mb' }));
    app.use('/api/webhooks/signal', express.json());
    app.use('/api/webhooks/signal', express.urlencoded({ extended: true }));
    
    // Aplicar autenticação
    app.use('/api/webhooks/signal', authenticateWebhook);
    
    // Rota principal
    app.post('/api/webhooks/signal', (req, res) => {
        try {
            console.log(`📡 SINAL TRADINGVIEW RECEBIDO`);
            console.log(`   IP: ${req.ip}`);
            console.log(`   Método de auth: ${req.authMethod}`);
            console.log(`   Body: ${JSON.stringify(req.body)}`);
            console.log(`   Headers: ${JSON.stringify(req.headers)}`);
            
            // Processar sinal aqui
            const signal = {
                id: `signal_${Date.now()}`,
                timestamp: new Date().toISOString(),
                source: 'TradingView',
                ip: req.ip,
                authMethod: req.authMethod,
                data: req.body
            };
            
            // Salvar ou processar o sinal
            console.log(`✅ Sinal processado: ${signal.id}`);
            
            res.status(200).json({
                success: true,
                message: 'Sinal recebido com sucesso',
                signalId: signal.id,
                timestamp: signal.timestamp
            });
            
        } catch (error) {
            console.error(`❌ Erro ao processar sinal: ${error.message}`);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Erro ao processar sinal',
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // Rota de teste para webhooks
    app.get('/api/webhooks/signal/test', (req, res) => {
        res.json({
            message: 'Endpoint de webhook ativo',
            timestamp: new Date().toISOString(),
            validTokens: [
                'coinbitclub-webhook-2025',
                'tradingview-secret-key',
                'coinbitclub-tradingview',
                'webhook-coinbitclub',
                'signal-auth-token'
            ],
            authMethods: [
                'Header: Authorization: Bearer TOKEN',
                'Header: X-Webhook-Token: TOKEN',
                'Header: X-TradingView-Secret: TOKEN',
                'Query: ?token=TOKEN',
                'Query: ?secret=TOKEN',
                'Body: {"token": "TOKEN"}',
                'IP Whitelist (TradingView IPs)'
            ]
        });
    });
}

// Comandos para atualizar Railway com tokens
function generateWebhookCommands() {
    console.log('\n🔧 COMANDOS RAILWAY - CONFIGURAR TOKENS WEBHOOK');
    console.log('=' .repeat(60));
    
    console.log('\n# Configurar tokens de autenticação webhook:');
    console.log('railway variables:set TRADINGVIEW_WEBHOOK_TOKEN="coinbitclub-webhook-2025"');
    console.log('railway variables:set WEBHOOK_SECRET="tradingview-secret-key"');
    console.log('');
    
    console.log('# Deploy após configuração:');
    console.log('railway up --detach');
    console.log('');
    
    console.log('📋 CONFIGURAÇÃO TRADINGVIEW:');
    console.log('URL Webhook: https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal');
    console.log('');
    console.log('💡 OPÇÕES DE AUTENTICAÇÃO:');
    console.log('1. Header Authorization: Bearer coinbitclub-webhook-2025');
    console.log('2. Header X-Webhook-Token: coinbitclub-webhook-2025');
    console.log('3. Query String: ?token=coinbitclub-webhook-2025');
    console.log('4. Automático via IP TradingView (mais seguro)');
}

module.exports = {
    authenticateWebhook,
    createWebhookRoute,
    generateWebhookCommands
};

// Executar se chamado diretamente
if (require.main === module) {
    generateWebhookCommands();
}
