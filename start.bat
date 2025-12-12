@echo off
echo ========================================
echo   Iniciando Eventify - Full Stack
echo ========================================
echo.

echo [1/3] Verificando dependencias...
if not exist "node_modules\" (
    echo Instalando dependencias raiz...
    call npm install
)

if not exist "backend\node_modules\" (
    echo Instalando dependencias del backend...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules\" (
    echo Instalando dependencias del frontend...
    cd frontend
    call npm install
    cd ..
)

echo.
echo [2/3] Verificando configuracion...
if not exist "backend\.env" (
    echo ADVERTENCIA: No se encontro backend\.env
    echo Copia .env.example a .env y configuralo
    pause
)

echo.
echo [3/3] Iniciando servidores...
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Presiona Ctrl+C para detener ambos servidores
echo.

npm run dev
