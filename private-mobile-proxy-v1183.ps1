param(
  [Parameter(Mandatory=$true)][string]$AppFile,
  [int]$Port = 8765,
  [string]$LogFile = "$env:TEMP\UltimatePromptCreator-MobileBridge.log"
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http

function Log([string]$m) {
  $line = "[$(Get-Date -Format s)] $m"
  Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

if (-not (Test-Path $AppFile)) { throw "App file not found: $AppFile" }

$listener = New-Object System.Net.HttpListener
$prefix = "http://127.0.0.1:$Port/"
$listener.Prefixes.Add($prefix)
$listener.Start()

$handler = New-Object System.Net.Http.HttpClientHandler
$client = New-Object System.Net.Http.HttpClient($handler)
$client.Timeout = [TimeSpan]::FromMinutes(10)

Log "Bridge started on $prefix using app $AppFile"

function Write-Bytes($ctx, [byte[]]$bytes, [string]$contentType, [int]$statusCode = 200) {
  $ctx.Response.StatusCode = $statusCode
  if ($contentType) { $ctx.Response.ContentType = $contentType }
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes,0,$bytes.Length)
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $path = $ctx.Request.Url.AbsolutePath

    if ($path -eq '/' -or $path -eq '/index.html') {
      $bytes = [IO.File]::ReadAllBytes($AppFile)
      Write-Bytes $ctx $bytes 'text/html; charset=utf-8' 200
    }
    elseif ($path -eq '/health') {
      $bytes = [Text.Encoding]::UTF8.GetBytes('OK')
      Write-Bytes $ctx $bytes 'text/plain; charset=utf-8' 200
    }
    elseif ($path.StartsWith('/ollama/')) {
      $backendPath = $path.Substring('/ollama'.Length)
      if (-not $backendPath.StartsWith('/')) { $backendPath = '/' + $backendPath }
      $backendUri = "http://127.0.0.1:11434$backendPath$($ctx.Request.Url.Query)"

      $method = New-Object System.Net.Http.HttpMethod($ctx.Request.HttpMethod)
      $msg = New-Object System.Net.Http.HttpRequestMessage($method,$backendUri)

      if ($ctx.Request.HasEntityBody) {
        $ms = New-Object IO.MemoryStream
        $ctx.Request.InputStream.CopyTo($ms)
        $content = New-Object System.Net.Http.ByteArrayContent($ms.ToArray())
        if ($ctx.Request.ContentType) {
          $content.Headers.TryAddWithoutValidation('Content-Type',$ctx.Request.ContentType) | Out-Null
        }
        $msg.Content = $content
      }
      if ($ctx.Request.Headers['Accept']) {
        $msg.Headers.TryAddWithoutValidation('Accept',$ctx.Request.Headers['Accept']) | Out-Null
      }

      Log "Proxy $($ctx.Request.HttpMethod) $path -> $backendUri"
      $resp = $client.SendAsync($msg).GetAwaiter().GetResult()
      $ctx.Response.StatusCode = [int]$resp.StatusCode
      $ct = $resp.Content.Headers.ContentType
      if ($ct) { $ctx.Response.ContentType = $ct.ToString() }
      $bytes = $resp.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes,0,$bytes.Length)
      $resp.Dispose()
      $msg.Dispose()
    }
    else {
      $bytes = [Text.Encoding]::UTF8.GetBytes('Not found')
      Write-Bytes $ctx $bytes 'text/plain; charset=utf-8' 404
    }
  }
  catch {
    Log "ERROR: $($_.Exception.Message)"
    try {
      $bytes = [Text.Encoding]::UTF8.GetBytes("Bridge error: $($_.Exception.Message)")
      Write-Bytes $ctx $bytes 'text/plain; charset=utf-8' 500
    } catch {}
  }
  finally {
    try { $ctx.Response.OutputStream.Close() } catch {}
    try { $ctx.Response.Close() } catch {}
  }
}
