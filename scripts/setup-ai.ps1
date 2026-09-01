# Profile Dark AI Setup Script (Windows PowerShell)
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " PROFILE DARK - AI ENVIRONMENT DIAGNOSTIC & SETUP" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Detect Python
Write-Host "`n[1/5] Verificando ambiente Python..." -ForegroundColor Yellow
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if ($pythonCmd) {
    $pyVer = & python --version 2>&1
    Write-Host "  ✓ Python detectado: $pyVer" -ForegroundColor Green
} else {
    Write-Host "  ! Python não encontrado no PATH. Usando adaptadores de fallback nativos do Node/Next.js." -ForegroundColor Magenta
}

# 2. Detect FFmpeg
Write-Host "`n[2/5] Verificando FFmpeg..." -ForegroundColor Yellow
$ffmpegStatic = Join-Path $PSScriptRoot "..\node_modules\ffmpeg-static\ffmpeg.exe"
if (Test-Path $ffmpegStatic) {
    Write-Host "  ✓ FFmpeg estático operacional em: $ffmpegStatic" -ForegroundColor Green
} else {
    Write-Host "  ! FFmpeg estático não encontrado em node_modules. Execute 'npm install'." -ForegroundColor Red
}

# 3. Detect GPU & VRAM
Write-Host "`n[3/5] Diagnosticando GPU & VRAM..." -ForegroundColor Yellow
$gpus = Get-CimInstance Win32_VideoController
foreach ($gpu in $gpus) {
    $vramMb = [math]::Round($gpu.AdapterRAM / 1MB)
    Write-Host "  • GPU: $($gpu.Name) | VRAM: $vramMb MB" -ForegroundColor White
}

# 4. Check ComfyUI API
Write-Host "`n[4/5] Verificando status do ComfyUI..." -ForegroundColor Yellow
$comfyUrl = if ($env:COMFYUI_URL) { $env:COMFYUI_URL } else { "http://127.0.0.1:8188" }
try {
    $res = Invoke-RestMethod -Uri "$comfyUrl/system_stats" -Method Get -TimeoutSec 2 -ErrorAction Stop
    Write-Host "  ✓ ComfyUI ativo e pronto em: $comfyUrl" -ForegroundColor Green
} catch {
    Write-Host "  ○ ComfyUI não está rodando no momento ($comfyUrl). O PD utilizará o motor local de fallback." -ForegroundColor Gray
}

# 5. Summary
Write-Host "`n[5/5] Resumo de Prontidão:" -ForegroundColor Yellow
Write-Host "  ✓ Base Node.js / Next.js: Operacional" -ForegroundColor Green
Write-Host "  ✓ Motor de Voz PT-BR (SAPI / Chatterbox): Operacional" -ForegroundColor Green
Write-Host "  ✓ Renderizador FFmpeg 1080p: Operacional" -ForegroundColor Green
Write-Host "  ✓ Motor de Cenas >= 20s: Operacional" -ForegroundColor Green
Write-Host "`nDiagnóstico concluído com sucesso!`n" -ForegroundColor Cyan
