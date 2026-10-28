# instalar-launcher.ps1 - Monta (config.xml + src), assina (perfil 'mendes'), instala e abre o launcher na TV.
# Instala SOMENTE o app LMlauncher.Home. Nao altera o sistema. Reversivel: scripts\remover-launcher.bat
param([string]$TvIp = "192.168.18.77", [string]$Perfil = "mendes")
$ErrorActionPreference = 'Continue'
$root  = Resolve-Path (Join-Path $PSScriptRoot "..")
$build = Join-Path $root "build"
$out   = Join-Path $build ".buildResult"
$sdb   = "C:\tizen-studio\tools\sdb.exe"
$tz    = "C:\tizen-studio\tools\ide\bin\tizen.bat"
$serial = "$TvIp`:26101"
$appId = "LMlauncher.Home"
$logDir = Join-Path $root "..\diagnostico"; New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir ("launcher_install_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".txt")
function Run($t,[scriptblock]$b){ $h="`n==== $t ===="; Add-Content $log $h; Write-Host $h -ForegroundColor Cyan; $r=(& $b 2>&1|Out-String); Add-Content $log $r; Write-Host $r }
if(-not(Test-Path $tz)){ "tizen CLI nao encontrado em $tz" | Tee-Object $log -Append; exit 1 }

# 1) Monta a pasta build = config.xml + conteudo de src (raiz do pacote .wgt)
if(Test-Path $build){ Remove-Item -Recurse -Force $build }
New-Item -ItemType Directory -Force -Path $build | Out-Null
Copy-Item (Join-Path $root "config.xml") (Join-Path $build "config.xml")
Copy-Item (Join-Path $root "src\*") $build -Recurse -Force
Run "CONECTAR" { & $sdb connect $serial; & $sdb devices }
Run "BUILD" { & $tz build-web -- $build }
Run "PACKAGE (perfil $Perfil)" { & $tz package -t wgt -s $Perfil -- $out }
$wgt = Get-ChildItem -Path $out -Filter *.wgt -ErrorAction SilentlyContinue | Select-Object -First 1
if(-not $wgt){ "FALHA: .wgt nao gerado. Veja o log: $log" | Tee-Object $log -Append; exit 1 }
$final = Join-Path $out "Launcher.wgt"
if($wgt.FullName -ne $final){ Move-Item -Force $wgt.FullName $final }
Run "INSTALL" { & $tz install -s $serial --name Launcher.wgt -- $out }
Run "RUN" { & $tz run -s $serial -p $appId }
"`nLog: $log" | Tee-Object $log -Append
