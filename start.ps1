# Script para iniciar Eventify (Backend + Frontend)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Iniciando Eventify - Full Stack" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar dependencias
Write-Host "[1/3] Verificando dependencias..." -ForegroundColor Yellow

if (-not (Test-Path "node_modules")) {
    Write-Host "  Instalando dependencias raiz..." -ForegroundColor Gray
    npm install
}

if (-not (Test-Path "backend\node_modules")) {
    Write-Host "  Instalando dependencias del backend..." -ForegroundColor Gray
    Set-Location backend
    npm install
    Set-Location ..
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "  Instalando dependencias del frontend..." -ForegroundColor Gray
    Set-Location frontend
    npm install
    Set-Location ..
}

# Verificar .env
Write-Host ""
Write-Host "[2/3] Verificando configuracion..." -ForegroundColor Yellow

if (-not (Test-Path "backend\.env")) {
    Write-Host "  ADVERTENCIA: No se encontro backend\.env" -ForegroundColor Red
    Write-Host "  Copia .env.example a .env y configuralo" -ForegroundColor Red
    Write-Host ""
    $continue = Read-Host "  Continuar de todos modos? (S/N)"
    if ($continue -ne "S" -and $continue -ne "s") {
        exit
    }
}

# Iniciar servidores
Write-Host ""
Write-Host "[3/3] Iniciando servidores..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Backend:  " -NoNewline -ForegroundColor Green
Write-Host "http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend: " -NoNewline -ForegroundColor Magenta
Write-Host "http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "  Presiona Ctrl+C para detener ambos servidores" -ForegroundColor Gray
Write-Host ""

npm run dev
