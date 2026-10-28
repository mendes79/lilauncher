# teste-minimo.ps1 - Instala uma versao MINIMA (sem imagens) para isolar a causa do erro de instalacao.
param([string]$TvIp = "192.168.18.77", [string]$Perfil = "mendes")
$ErrorActionPreference='Continue'
$root=Resolve-Path (Join-Path $PSScriptRoot "..")
$proj=Join-Path $root "test-min"
$out=Join-Path $proj ".buildResult"
$sdb="C:\tizen-studio\tools\sdb.exe"; $tz="C:\tizen-studio\tools\ide\bin\tizen.bat"
$serial="$TvIp`:26101"
& $sdb connect $serial; & $sdb devices
if(Test-Path $out){ Remove-Item -Recurse -Force $out }
& $tz build-web -- $proj
& $tz package -t wgt -s $Perfil -- $out
$wgt=Get-ChildItem -Path $out -Filter *.wgt | Select-Object -First 1
if(-not $wgt){ "FALHA: wgt nao gerado"; exit 1 }
$final=Join-Path $out "Launcher.wgt"; if($wgt.FullName -ne $final){ Move-Item -Force $wgt.FullName $final }
"Tamanho do wgt: {0:N0} bytes" -f (Get-Item $final).Length
& $tz install -s $serial --name Launcher.wgt -- $out
