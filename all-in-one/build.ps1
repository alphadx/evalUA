# ============================================
# EvalUA v3.0 - Build All-in-One Image (PowerShell)
# Genera imagen Docker con todo incluido
# y la exporta como .tar para distribucion
# ============================================

param(
    [string]$ImageName = "evalua-allinone:latest",
    [string]$TarOutput = "evalua-allinone.tar"
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path "$ScriptDir\..").Path

$line = "=========================================="

Write-Host $line -ForegroundColor Cyan
Write-Host " EvalUA v3.0 - Build All-in-One" -ForegroundColor Cyan
Write-Host $line -ForegroundColor Cyan
Write-Host ""
Write-Host " Imagen:   $ImageName"
Write-Host " Tar:      $TarOutput"
Write-Host " Contexto: $RepoRoot"
Write-Host ""

Write-Host "[1/2] Construyendo imagen Docker..." -ForegroundColor Yellow
$buildCmd = @("build", "-f", "$ScriptDir\Dockerfile", "-t", $ImageName, $RepoRoot)

& docker @buildCmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: docker build fallo" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/2] Exportando imagen a $TarOutput..." -ForegroundColor Yellow
$tarPath = "$ScriptDir\$TarOutput"
docker save $ImageName -o $tarPath
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: docker save fallo" -ForegroundColor Red
    exit $LASTEXITCODE
}

$tarSizeMB = [math]::Round((Get-Item $tarPath).Length / 1MB, 1)

Write-Host ""
Write-Host $line -ForegroundColor Green
Write-Host " Build completado" -ForegroundColor Green
Write-Host $line -ForegroundColor Green
Write-Host " Imagen: $ImageName"

$msg = " Tar:    " + $tarPath + " [" + $tarSizeMB + " MB]"
Write-Host $msg

Write-Host ""
Write-Host " Para cargar en otro servidor:"
$msg2 = "   docker load -i " + $TarOutput
Write-Host $msg2

Write-Host ""
Write-Host " Para ejecutar:"
Write-Host '   docker run -d -p 3000:3000 \'
Write-Host '     -v evalua-mongo:/data/db \'
Write-Host '     -v evalua-redis:/data/redis \'
Write-Host '     -e KEY="tu-clave-secreta" \'
$msg3 = "     " + $ImageName
Write-Host $msg3

Write-Host ""
Write-Host " Para subpath /evalua/ (detras de nginx):"
Write-Host '   docker run -d -p 3000:3000 \'
Write-Host '     -v evalua-mongo:/data/db \'
Write-Host '     -v evalua-redis:/data/redis \'
Write-Host '     -e KEY="tu-clave-secreta" \'
Write-Host '     -e NEXT_PUBLIC_BASE_PATH=/evalua \'
$msg4 = "     " + $ImageName
Write-Host $msg4
Write-Host $line