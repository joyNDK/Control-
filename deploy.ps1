# SCRIPT DE DÉPLOIEMENT CONTROLPI
Write-Host ""
Write-Host "DEPLOIEMENT CONTROLPI" -ForegroundColor Cyan
Write-Host ""

# Variables
$FRONTEND_URL = "https://controlpi-frontend.vercel.app"
$BACKEND_URL = "https://svzsgd-3000.csb.app"

Write-Host "1. Verification du projet..."
if (-Not (Test-Path ".git")) {
    Write-Host "ERREUR: Pas de repository Git" -ForegroundColor Red
    exit 1
}

Write-Host "2. Deploiement sur Vercel..."
git add .
git commit -m "Deploy ControlPi" 2>$null
git push origin main

Write-Host ""
Write-Host "URLs importantes:" -ForegroundColor Green
Write-Host "Frontend: $FRONTEND_URL" -ForegroundColor Yellow
Write-Host "Backend: $BACKEND_URL" -ForegroundColor Yellow
Write-Host ""
Write-Host "Deploiement termine!" -ForegroundColor Green

exit 0