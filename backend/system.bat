@echo off
:: 🚀 COINBITCLUB SYSTEM MANAGER
:: Scripts de controle do sistema

echo.
echo =========================================
echo   🚀 COINBITCLUB SYSTEM MANAGER V4.0.0
echo =========================================
echo.

if "%1"=="ligar" goto :ligar
if "%1"=="desligar" goto :desligar
if "%1"=="reiniciar" goto :reiniciar
if "%1"=="status" goto :status
if "%1"=="dashboard" goto :dashboard
if "%1"=="logs" goto :logs

:menu
echo Comandos disponíveis:
echo.
echo   📋 system.bat status       - Verificar status
echo   🔋 system.bat ligar        - Ligar sistema completo
echo   🔌 system.bat desligar     - Desligar sistema
echo   🔄 system.bat reiniciar    - Reiniciar sistema
echo   📊 system.bat dashboard    - Abrir dashboard
echo   📜 system.bat logs         - Ver logs do sistema
echo.
goto :end

:ligar
echo 🔋 Ligando sistema completo...
node gestor-universal-sistema.js ligar
goto :end

:desligar
echo 🔌 Desligando sistema...
node gestor-universal-sistema.js desligar
goto :end

:reiniciar
echo 🔄 Reiniciando sistema...
node gestor-universal-sistema.js reiniciar
goto :end

:status
echo 📊 Verificando status...
node gestor-universal-sistema.js status
goto :end

:dashboard
echo 📊 Abrindo dashboard...
start http://localhost:3009
goto :end

:logs
echo 📜 Logs do sistema:
echo.
echo Dashboard: http://localhost:3009
echo Trading: http://localhost:3010
echo Sinais: http://localhost:9001
echo Risco: http://localhost:3011
echo Operações: http://localhost:3012
echo Monitoramento: http://localhost:3013
echo Indicadores: http://localhost:3014
echo WebSocket: http://localhost:3015
goto :end

:end
echo.
pause
