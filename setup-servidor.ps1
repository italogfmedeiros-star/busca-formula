# ============================================================
# setup-servidor.ps1
# Instala e configura o Busca Formula como servico Windows
# Executar como Administrador no servidor do laboratorio
# ============================================================

$ErrorActionPreference = "Stop"
$PASTA_RELATORIOS = "C:\Medicator\ARQ"
$APP_PORT = 3000

Write-Host ""
Write-Host "=== Busca Formula - Setup do Servidor ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Node.js
Write-Host "[1/6] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "      Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "ERRO: Node.js nao encontrado." -ForegroundColor Red
    Write-Host "      Baixe em: https://nodejs.org (versao LTS)" -ForegroundColor Red
    Write-Host "      Apos instalar, execute este script novamente." -ForegroundColor Red
    exit 1
}

# 2. Criar .env.local
Write-Host "[2/6] Configurando variavel de ambiente..." -ForegroundColor Yellow
$envContent = "PASTA_RELATORIOS=$PASTA_RELATORIOS"
Set-Content -Path ".env.local" -Value $envContent -Encoding UTF8
Write-Host "      .env.local criado: PASTA_RELATORIOS=$PASTA_RELATORIOS" -ForegroundColor Green

if (-not (Test-Path $PASTA_RELATORIOS)) {
    Write-Host "      AVISO: Pasta '$PASTA_RELATORIOS' nao encontrada." -ForegroundColor Yellow
    Write-Host "      O watcher nao vai funcionar ate que a pasta exista." -ForegroundColor Yellow
}

# 3. Instalar dependencias
Write-Host "[3/6] Instalando dependencias (npm install)..." -ForegroundColor Yellow
npm install
Write-Host "      Dependencias instaladas." -ForegroundColor Green

# 4. Build de producao
Write-Host "[4/6] Compilando o app (npm run build)..." -ForegroundColor Yellow
npm run build
Write-Host "      Build concluido." -ForegroundColor Green

# 5. Instalar pm2
Write-Host "[5/6] Instalando pm2 (gerenciador de processos)..." -ForegroundColor Yellow
npm install -g pm2

# Atualiza PATH da sessao para reconhecer o pm2 recem instalado
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")

Write-Host "      pm2 instalado." -ForegroundColor Green

pm2 delete busca-formula 2>$null

pm2 start npm --name "busca-formula" -- start -- -p $APP_PORT
pm2 save
Write-Host "      App iniciado na porta $APP_PORT." -ForegroundColor Green

# 6. Criar tarefa agendada para auto-start no boot
Write-Host "[6/6] Configurando auto-start no Windows..." -ForegroundColor Yellow

$pm2Path = (Get-Command pm2.cmd -ErrorAction SilentlyContinue).Source
if (-not $pm2Path) {
    $npmGlobal = npm root -g
    $pm2Path = Join-Path (Split-Path $npmGlobal) "pm2.cmd"
}

$action = New-ScheduledTaskAction -Execute $pm2Path -Argument "resurrect"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 0) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
    -TaskName "BuscaFormula-AutoStart" `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings `
    -Description "Inicia o Busca Formula via pm2 automaticamente ao ligar o servidor" `
    -Force

Write-Host "      Tarefa agendada criada." -ForegroundColor Green

Write-Host ""
Write-Host "=== Instalacao concluida! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "  App rodando em: http://localhost:$APP_PORT" -ForegroundColor White
Write-Host "  Monitorando pasta: $PASTA_RELATORIOS" -ForegroundColor White
Write-Host ""
Write-Host "Comandos uteis:" -ForegroundColor Yellow
Write-Host "  pm2 status                    - ver status do app"
Write-Host "  pm2 logs busca-formula        - ver logs em tempo real"
Write-Host "  pm2 restart busca-formula     - reiniciar o app"
Write-Host ""
