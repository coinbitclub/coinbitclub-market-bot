#!/bin/bash
# 🔍 SCRIPT DE VALIDAÇÃO PRÉ-DEPLOY - COINBITCLUB
# Validar configurações antes do deploy para evitar erro 502

echo "🔍 INICIANDO VALIDAÇÃO PRÉ-DEPLOY..."
echo "=" | tr ' ' '=' | head -c 50; echo

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Função para log de erro
log_error() {
    echo -e "${RED}❌ ERRO: $1${NC}"
    ERRORS=$((ERRORS + 1))
}

# Função para log de sucesso
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Função para log de aviso
log_warning() {
    echo -e "${YELLOW}⚠️ AVISO: $1${NC}"
}

echo "1. 📁 Verificando estrutura de arquivos..."

# Verificar se servidor multiservice existe
if [ -f "server-multiservice-complete.cjs" ]; then
    log_success "Servidor multiservice encontrado"
else
    log_error "server-multiservice-complete.cjs não encontrado!"
    echo "   💡 Solução: Verificar se o arquivo existe no diretório raiz"
fi

# Verificar railway.toml
if [ -f "railway.toml" ]; then
    log_success "railway.toml encontrado"
    
    # Verificar se está configurado para multiservice
    if grep -q "server-multiservice-complete.cjs" railway.toml; then
        log_success "railway.toml configurado para multiservice"
    else
        log_error "railway.toml NÃO está configurado para usar servidor multiservice!"
        echo "   💡 Solução: Alterar startCommand para 'node server-multiservice-complete.cjs'"
    fi
else
    log_error "railway.toml não encontrado!"
fi

# Verificar Dockerfile
if [ -f "Dockerfile" ]; then
    log_success "Dockerfile encontrado"
    
    if grep -q "server-multiservice-complete.cjs" Dockerfile; then
        log_success "Dockerfile configurado para multiservice"
    else
        log_error "Dockerfile NÃO está configurado para usar servidor multiservice!"
        echo "   💡 Solução: Alterar CMD para ['node', 'server-multiservice-complete.cjs']"
    fi
else
    log_error "Dockerfile não encontrado!"
fi

# Verificar package.json
if [ -f "package.json" ]; then
    log_success "package.json encontrado"
    
    # Verificar se tem script start correto
    if grep -q "server-multiservice-complete.cjs" package.json; then
        log_success "package.json configurado para multiservice"
    else
        log_warning "package.json pode não estar configurado para multiservice"
        echo "   💡 Recomendação: Adicionar script 'start': 'node server-multiservice-complete.cjs'"
    fi
else
    log_error "package.json não encontrado!"
fi

echo
echo "2. 🔧 Verificando sintaxe do código..."

# Verificar sintaxe do servidor multiservice
if [ -f "server-multiservice-complete.cjs" ]; then
    if node -c server-multiservice-complete.cjs 2>/dev/null; then
        log_success "Sintaxe do servidor multiservice válida"
    else
        log_error "Sintaxe do servidor multiservice INVÁLIDA!"
        echo "   💡 Solução: Verificar erros de JavaScript no arquivo"
        node -c server-multiservice-complete.cjs
    fi
fi

echo
echo "3. 📡 Verificando endpoints críticos..."

# Verificar se webhook está implementado
if [ -f "server-multiservice-complete.cjs" ]; then
    if grep -q "/api/webhooks/signal" server-multiservice-complete.cjs; then
        log_success "Endpoint webhook implementado"
    else
        log_error "Endpoint /api/webhooks/signal NÃO implementado!"
        echo "   💡 Solução: Adicionar rota do webhook no servidor"
    fi
    
    # Verificar endpoint de teste
    if grep -q "/api/webhooks/signal/test" server-multiservice-complete.cjs; then
        log_success "Endpoint de teste implementado"
    else
        log_warning "Endpoint de teste não encontrado"
        echo "   💡 Recomendação: Adicionar endpoint /api/webhooks/signal/test"
    fi
fi

echo
echo "4. 🗃️ Verificando dependências..."

# Verificar se node_modules existe
if [ -d "node_modules" ]; then
    log_success "Dependências instaladas"
else
    log_warning "node_modules não encontrado"
    echo "   💡 Recomendação: Executar 'npm install'"
fi

# Verificar se package-lock.json existe
if [ -f "package-lock.json" ]; then
    log_success "package-lock.json encontrado"
else
    log_warning "package-lock.json não encontrado"
    echo "   💡 Recomendação: Executar 'npm install' para gerar"
fi

echo
echo "5. 🚀 Teste de execução local..."

# Testar se o servidor inicia (timeout de 10 segundos)
if [ -f "server-multiservice-complete.cjs" ]; then
    echo "   Testando inicialização do servidor..."
    
    # Iniciar servidor em background e capturar PID
    timeout 10s node server-multiservice-complete.cjs &
    SERVER_PID=$!
    
    # Aguardar um pouco para o servidor iniciar
    sleep 3
    
    # Verificar se processo ainda está rodando
    if kill -0 $SERVER_PID 2>/dev/null; then
        log_success "Servidor inicia corretamente"
        # Matar o processo
        kill $SERVER_PID 2>/dev/null
    else
        log_error "Servidor falha ao iniciar!"
        echo "   💡 Solução: Verificar logs de erro na inicialização"
    fi
else
    log_warning "Não foi possível testar - arquivo não encontrado"
fi

echo
echo "=" | tr ' ' '=' | head -c 50; echo
echo "📊 RESUMO DA VALIDAÇÃO"
echo "=" | tr ' ' '=' | head -c 50; echo

if [ $ERRORS -eq 0 ]; then
    log_success "VALIDAÇÃO APROVADA - Sistema pronto para deploy!"
    echo
    echo "🚀 Próximos passos:"
    echo "   1. git add -A"
    echo "   2. git commit -m '🔧 Deploy: Configuração validada'"
    echo "   3. git push origin main"
    echo "   4. railway up --detach"
    echo
    exit 0
else
    log_error "VALIDAÇÃO FALHADA - $ERRORS erro(s) encontrado(s)"
    echo
    echo "🔧 Corrija os erros acima antes do deploy!"
    echo
    echo "📋 Comandos de correção rápida:"
    echo "   # Corrigir railway.toml:"
    echo "   sed -i 's/startCommand = .*/startCommand = \"node server-multiservice-complete.cjs\"/' railway.toml"
    echo
    echo "   # Corrigir Dockerfile:"
    echo "   sed -i 's/CMD \\[.*\\]/CMD [\"node\", \"server-multiservice-complete.cjs\"]/' Dockerfile"
    echo
    exit 1
fi
