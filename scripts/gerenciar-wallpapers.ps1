# Gerenciador de wallpapers do lilauncher.
# Lista, adiciona/substitui ou remove papeis de parede, regenera a walls.js e reinstala na TV.
param([string]$TvIp = "192.168.18.77", [string]$Perfil = "mendes")
$ErrorActionPreference = 'Stop'
try { Add-Type -AssemblyName System.Drawing } catch {}

$root    = Resolve-Path (Join-Path $PSScriptRoot "..")
$wallDir = Join-Path $root "src\img\wallpapers"
$scan    = Join-Path $PSScriptRoot "scan-walls.mjs"
$install = Join-Path $PSScriptRoot "instalar-launcher.ps1"
if (-not (Test-Path $wallDir)) { New-Item -ItemType Directory -Force -Path $wallDir | Out-Null }

function Listar {
  $files = @(Get-ChildItem $wallDir -File | Where-Object { $_.Extension -match '\.(jpe?g|png|webp)$' } | Sort-Object Name)
  if ($files.Count -eq 0) { Write-Host "  (nenhum wallpaper na pasta)"; return @() }
  for ($i = 0; $i -lt $files.Count; $i++) {
    $kb = [int]($files[$i].Length / 1KB)
    Write-Host ("  [{0}] {1}  ({2} KB)" -f ($i + 1), $files[$i].Name, $kb)
  }
  return $files
}

# Redimensiona para caber em 1920x1080 (sem ampliar) e salva como JPEG otimizado.
# Se o System.Drawing falhar por algum motivo, copia o arquivo original.
function Tratar-E-Salvar($srcPath, $dstPath) {
  try {
    $img = [System.Drawing.Image]::FromFile($srcPath)
    try {
      $r = [Math]::Min(1920.0 / $img.Width, 1080.0 / $img.Height)
      if ($r -gt 1) { $r = 1 }
      $nw = [int]($img.Width * $r); $nh = [int]($img.Height * $r)
      $bmp = New-Object System.Drawing.Bitmap $nw, $nh
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.DrawImage($img, 0, 0, $nw, $nh)
      $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
      $ep = New-Object System.Drawing.Imaging.EncoderParameters 1
      $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [int64]82)
      $bmp.Save($dstPath, $enc, $ep)
      $g.Dispose(); $bmp.Dispose()
    } finally { $img.Dispose() }
  } catch {
    Write-Host "Aviso: nao consegui redimensionar, copiando o arquivo original."
    Copy-Item $srcPath $dstPath -Force
  }
}

function Adicionar {
  $src = Read-Host "Caminho da imagem (arraste o arquivo para a janela e tecle Enter)"
  $src = $src.Trim().Trim('"')
  if (-not (Test-Path $src)) { Write-Host "Arquivo nao encontrado."; return }
  $base = [IO.Path]::GetFileNameWithoutExtension($src)
  $base = ($base -replace '[^A-Za-z0-9_-]', '_').ToLower()
  if (-not $base) { $base = "wallpaper" }
  $dst = Join-Path $wallDir ($base + ".jpg")
  if (Test-Path $dst) {
    $ok = Read-Host "Ja existe '$base.jpg'. Substituir? (s/n)"
    if ($ok -ne 's') { Write-Host "Cancelado."; return }
  }
  Tratar-E-Salvar $src $dst
  $kb = [int]((Get-Item $dst).Length / 1KB)
  Write-Host "Pronto: $base.jpg ($kb KB)."
}

function Remover {
  $files = Listar
  if ($files.Count -eq 0) { return }
  $n = Read-Host "Numero do wallpaper a remover (Enter cancela)"
  if (-not $n) { return }
  $i = [int]$n - 1
  if ($i -lt 0 -or $i -ge $files.Count) { Write-Host "Numero invalido."; return }
  $alvo = $files[$i]
  $ok = Read-Host "Remover '$($alvo.Name)'? (s/n)"
  if ($ok -eq 's') { Remove-Item $alvo.FullName -Force; Write-Host "Removido." }
}

function Regenerar {
  Push-Location $root
  try { node $scan } finally { Pop-Location }
}

function Aplicar {
  Write-Host "Regenerando a lista (walls.js)..."
  Regenerar
  Write-Host "Reinstalando o launcher na TV..."
  & $install -TvIp $TvIp -Perfil $Perfil
}

:menu while ($true) {
  Write-Host ""
  Write-Host "===== Wallpapers do lilauncher ====="
  Listar | Out-Null
  Write-Host ""
  Write-Host "  1. Adicionar ou substituir imagem"
  Write-Host "  2. Remover imagem"
  Write-Host "  3. Aplicar na TV (regenera a lista e reinstala)"
  Write-Host "  0. Sair"
  $op = Read-Host "Escolha"
  switch ($op) {
    '1' { Adicionar; Regenerar }
    '2' { Remover; Regenerar }
    '3' { Aplicar }
    '0' { break menu }
    default { Write-Host "Opcao invalida." }
  }
}
Write-Host "Ate mais."
