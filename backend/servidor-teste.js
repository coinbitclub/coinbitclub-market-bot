/**
 * 🚀 SERVIDOR DE TESTE SIMPLES
 * Para verificar se as rotas dos gestores funcionam
 */

const express = require('express');
const cors = require('cors');

// Importar rotas dos gestores
const chavesRoutes = require('./routes/chavesRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const afiliadosRoutes = require('./routes/afiliadosRoutes');

console.log('🚀 SERVIDOR DE TESTE INICIANDO...');

const app = express();

// Configuração básica
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// ===== ROTAS DOS GESTORES =====
console.log('🔗 Registrando rotas dos gestores...');

app.use('/api/gestores/chaves', chavesRoutes);
app.use('/api/gestores/usuarios', usuariosRoutes);
app.use('/api/gestores/afiliados', afiliadosRoutes);

console.log('✅ Rotas registradas');

// Rota de debug para listar todas as rotas
app.get('/debug/routes', (req, res) => {
    const routes = [];
    
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    routes.push({
                        path: middleware.regexp.source.replace('\\', '').replace('/?', '') + handler.route.path,
                        methods: Object.keys(handler.route.methods)
                    });
                }
            });
        }
    });
    
    res.json({ routes });
});

// Middleware de erro
app.use((err, req, res, next) => {
    console.error('❌ Erro:', err.message);
    res.status(500).json({
        sucesso: false,
        erro: err.message
    });
});

// 404 handler
app.use('*', (req, res) => {
    console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        sucesso: false,
        erro: 'Rota não encontrada',
        url: req.originalUrl,
        method: req.method
    });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor de teste rodando em http://0.0.0.0:${PORT}`);
    console.log('📋 Rotas disponíveis:');
    console.log('  GET /health');
    console.log('  GET /debug/routes');
    console.log('  GET /api/gestores/chaves/parametrizacoes/padrao');
    console.log('  GET /api/gestores/usuarios/configuracoes');
    console.log('  GET /api/gestores/afiliados/configuracoes');
});
