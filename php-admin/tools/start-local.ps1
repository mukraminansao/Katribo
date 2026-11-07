param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$siteRoot = Join-Path $projectRoot 'katribo-react'
$siteUrl = 'http://localhost:10000/'
$env:KATRIBO_BACKEND_URL = 'http://127.0.0.1/Katribo/'

function Test-KatriboServer {
    try {
        $response = Invoke-WebRequest 'http://127.0.0.1:10000/' -UseBasicParsing -TimeoutSec 2
        return $response.StatusCode -eq 200 -and $response.Content.Contains('KATRIBO')
    } catch { return $false }
}

if (-not (Test-KatriboServer)) {
    if (-not (Test-Path -LiteralPath (Join-Path $siteRoot 'dist/index.html')) -or
        -not (Test-Path -LiteralPath (Join-Path $siteRoot 'dist-server/order.js'))) {
        throw 'Build the website first: in katribo-react, run npm ci --include=dev, then npm run build:server.'
    }
    $nodeExecutable = Join-Path $env:ProgramFiles 'nodejs/node.exe'
    if (-not (Test-Path -LiteralPath $nodeExecutable)) {
        $nodeExecutable = (Get-Command node.exe -ErrorAction Stop).Source
    }
    $runtimeRoot = Join-Path $projectRoot '.restoration'
    $env:PORT = '10000'
    Start-Process -FilePath $nodeExecutable -ArgumentList 'server.mjs' -WorkingDirectory $siteRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeRoot 'website.log') -RedirectStandardError (Join-Path $runtimeRoot 'website-error.log') | Out-Null
    $ready = $false
    for ($attempt = 0; $attempt -lt 15; $attempt++) {
        if (Test-KatriboServer) { $ready = $true; break }
        Start-Sleep -Milliseconds 200
    }
    if (-not $ready) { throw 'Website startup failed. Check .restoration/website-error.log and port 10000.' }
}
if (-not $NoBrowser) { Start-Process $siteUrl }
Write-Output "KATRIBO is ready: $siteUrl"
