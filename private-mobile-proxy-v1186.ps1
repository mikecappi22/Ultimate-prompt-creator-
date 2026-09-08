param(
  [Parameter(Mandatory=$true)][string]$AppFile,
  [int]$Port = 8765,
  [string]$LogFile = "$env:TEMP\UltimatePromptCreator-MobileBridge-V1186.log"
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http
Add-Type -AssemblyName System.Security

function Log([string]$m) {
  $line = "[$(Get-Date -Format s)] $m"
  Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

function Set-CommonHeaders($ctx) {
  $ctx.Response.Headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
  $ctx.Response.Headers['Pragma'] = 'no-cache'
  $ctx.Response.Headers['Expires'] = '0'
  $ctx.Response.Headers['X-UPC-Version'] = 'V11.8.6'
}

function Write-Bytes($ctx, [byte[]]$bytes, [string]$contentType, [int]$statusCode = 200) {
  $ctx.Response.StatusCode = $statusCode
  Set-CommonHeaders $ctx
  if ($contentType) { $ctx.Response.ContentType = $contentType }
  $ctx.Response.ContentLength64 = $bytes.Length
  if ($bytes.Length -gt 0) { $ctx.Response.OutputStream.Write($bytes,0,$bytes.Length) }
}

function Read-RequestBodyToMemoryStream($request) {
  $ms = [System.IO.MemoryStream]::new()
  if ($request.HasEntityBody) {
    $request.InputStream.CopyTo($ms)
  }
  $ms.Position = 0
  return $ms
}

if (-not (Test-Path $AppFile)) { throw "App file not found: $AppFile" }

$listener = [System.Net.HttpListener]::new()
$prefix = "http://127.0.0.1:$Port/"
$listener.Prefixes.Add($prefix)
$listener.Start()

$handler = [System.Net.Http.HttpClientHandler]::new()
$handler.AllowAutoRedirect = $false
$client = [System.Net.Http.HttpClient]::new($handler)
$client.Timeout = [TimeSpan]::FromMinutes(15)

Log "V11.8.6 StreamContent bridge started on $prefix using app $AppFile"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $path = $ctx.Request.Url.AbsolutePath

    if ($ctx.Request.HttpMethod -eq 'OPTIONS') {
      $ctx.Response.StatusCode = 204
      Set-CommonHeaders $ctx
      $ctx.Response.Headers['Allow'] = 'GET, POST, OPTIONS'
    }
    elseif ($path -eq '/' -or $path -eq '/index.html') {
      $bytes = [IO.File]::ReadAllBytes($AppFile)
      Write-Bytes $ctx $bytes 'text/html; charset=utf-8' 200
    }
    elseif ($path -eq '/health') {
      $bytes = [Text.Encoding]::UTF8.GetBytes('OK V11.8.6 STREAMCONTENT')
      Write-Bytes $ctx $bytes 'text/plain; charset=utf-8' 200
    }
    elseif ($path -eq '/bridge-info') {
      $obj = @{
        version = 'V11.8.6'
        transport = 'StreamContent'
        backend = 'http://127.0.0.1:11434'
        time = (Get-Date).ToString('o')
        log = $LogFile
      } | ConvertTo-Json -Compress
      $bytes = [Text.Encoding]::UTF8.GetBytes($obj)
      Write-Bytes $ctx $bytes 'application/json; charset=utf-8' 200
    }
    elseif ($path -eq '/bridge-echo' -and $ctx.Request.HttpMethod -eq 'POST') {
      $ms = Read-RequestBodyToMemoryStream $ctx.Request
      $len = $ms.Length
      $sha = [System.Security.Cryptography.SHA256]::Create()
      $hashBytes = $sha.ComputeHash($ms)
      $sha.Dispose()
      $hash = ([BitConverter]::ToString($hashBytes)).Replace('-','').ToLowerInvariant()
      $ms.Dispose()
      $obj = @{version='V11.8.6';length=$len;sha256=$hash;contentType=$ctx.Request.ContentType} | ConvertTo-Json -Compress
      $bytes = [Text.Encoding]::UTF8.GetBytes($obj)
      Write-Bytes $ctx $bytes 'application/json; charset=utf-8' 200
    }
    elseif ($path.StartsWith('/ollama/')) {
      $backendPath = $path.Substring('/ollama'.Length)
      if (-not $backendPath.StartsWith('/')) { $backendPath = '/' + $backendPath }
      $backendUri = "http://127.0.0.1:11434$backendPath$($ctx.Request.Url.Query)"

      $method = [System.Net.Http.HttpMethod]::new($ctx.Request.HttpMethod)
      $msg = [System.Net.Http.HttpRequestMessage]::new($method,$backendUri)
      $bodyStream = $null
      $content = $null

      if ($ctx.Request.HasEntityBody) {
        # IMPORTANT: StreamContent avoids PowerShell's byte-array argument expansion bug.
        $bodyStream = Read-RequestBodyToMemoryStream $ctx.Request
        $bodyLength = $bodyStream.Length
        $content = [System.Net.Http.StreamContent]::new($bodyStream)
        $content.Headers.ContentLength = $bodyLength
        if ($ctx.Request.ContentType) {
          $content.Headers.TryAddWithoutValidation('Content-Type',$ctx.Request.ContentType) | Out-Null
        }
        $msg.Content = $content
        Log "Proxy $($ctx.Request.HttpMethod) $path -> $backendUri body=$bodyLength bytes via StreamContent"
      } else {
        Log "Proxy $($ctx.Request.HttpMethod) $path -> $backendUri"
      }

      foreach($h in @('Accept','User-Agent')) {
        if ($ctx.Request.Headers[$h]) {
          $msg.Headers.TryAddWithoutValidation($h,$ctx.Request.Headers[$h]) | Out-Null
        }
      }

      $resp = $client.SendAsync($msg,[System.Net.Http.HttpCompletionOption]::ResponseHeadersRead).GetAwaiter().GetResult()
      $bytes = $resp.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()

      $ctx.Response.StatusCode = [int]$resp.StatusCode
      Set-CommonHeaders $ctx
      $ct = $resp.Content.Headers.ContentType
      if ($ct) { $ctx.Response.ContentType = $ct.ToString() }
      $ctx.Response.ContentLength64 = $bytes.Length
      if ($bytes.Length -gt 0) { $ctx.Response.OutputStream.Write($bytes,0,$bytes.Length) }

      $preview = ''
      try { $preview = [Text.Encoding]::UTF8.GetString($bytes); if($preview.Length -gt 1000){$preview=$preview.Substring(0,1000)} } catch {}
      Log "Backend status=$([int]$resp.StatusCode) path=$backendPath response=$preview"

      $resp.Dispose()
      $msg.Dispose()
      # Disposing HttpRequestMessage disposes StreamContent and its MemoryStream.
    }
    else {
      $bytes = [Text.Encoding]::UTF8.GetBytes('Not found')
      Write-Bytes $ctx $bytes 'text/plain; charset=utf-8' 404
    }
  }
  catch {
    Log "BRIDGE ERROR: $($_.Exception.ToString())"
    try {
      $payload = @{ error = "Bridge error: $($_.Exception.Message)"; version='V11.8.6'; transport='StreamContent' } | ConvertTo-Json -Compress
      $bytes = [Text.Encoding]::UTF8.GetBytes($payload)
      Write-Bytes $ctx $bytes 'application/json; charset=utf-8' 500
    } catch {}
  }
  finally {
    try { $ctx.Response.OutputStream.Close() } catch {}
    try { $ctx.Response.Close() } catch {}
  }
}
