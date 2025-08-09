@echo off
echo ============================================
echo 🧪 HOMOLOGACAO COMPLETA - COINBITCLUB v3.0
echo ============================================
echo 📱 Sistema com Integracao Zapi WhatsApp
echo 📅 Data: %date% %time%
echo ============================================

echo.
echo 🔍 ETAPA 1: Validando estrutura do banco...
echo --------------------------------------------
node validar-banco-homologacao.cjs

if %ERRORLEVEL% neq 0 (
    echo ❌ Falha na validacao do banco!
    echo 🚫 Homologacao interrompida
    pause
    exit /b 1
)

echo.
echo ✅ Banco validado com sucesso!
echo.

echo 🚀 ETAPA 2: Iniciando servidor para testes...
echo ----------------------------------------------
start "Backend Server" /min cmd /c "cd backend/api-gateway && npm start"

echo ⏳ Aguardando servidor inicializar...
timeout /t 10 /nobreak > nul

echo.
echo 🧪 ETAPA 3: Executando homologacao completa...
echo -----------------------------------------------
node homologacao-completa.cjs

if %ERRORLEVEL% equ 0 (
    echo.
    echo 🎉 ============================================
    echo 🎉 HOMOLOGACAO COMPLETA APROVADA!
    echo 🎉 ============================================
    echo ✅ Sistema pronto para producao
    echo 📱 Integracao Zapi funcional
    echo 🏆 Conformidade total atingida
    echo ============================================
) else (
    echo.
    echo ❌ ============================================
    echo ❌ HOMOLOGACAO REPROVADA
    echo ❌ ============================================
    echo 🔧 Correcoes necessarias
    echo 📝 Revisar falhas identificadas
    echo 🔄 Nova homologacao obrigatoria
    echo ============================================
)

echo.
echo 📋 Logs salvos em:
echo    - validacao-banco.log
echo    - homologacao-completa.log
echo.

pause
