# ==============================================================================
# Revelation Museum - Portable Offline Static HTTP Server
# Bound strictly to 127.0.0.1 (Localhost Only)
# ==============================================================================

param(
    [int]$Port = 3456,
    [string]$AppDir = "",
    [string]$LogFile = ""
)

$ErrorActionPreference = "Stop"

# Helper for diagnostic logging
function Write-ServerLog([string]$Message) {
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
    $Line = "[$Timestamp] $Message"
    if (-not [string]::IsNullOrEmpty($LogFile)) {
        try {
            Add-Content -Path $LogFile -Value $Line -ErrorAction SilentlyContinue
        } catch {}
    }
}

Write-ServerLog "Server script invoked with Port=$Port, AppDir='$AppDir'"

# 1. Resolve Application Directory
if ([string]::IsNullOrEmpty($AppDir)) {
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    if ([string]::IsNullOrEmpty($ScriptDir)) {
        $ScriptDir = $PSScriptRoot
    }
    $AppDir = Join-Path (Split-Path -Parent $ScriptDir) "app"
}

$AppDir = [System.IO.Path]::GetFullPath($AppDir)
Write-ServerLog "Resolved AppDir: '$AppDir'"

if (-not (Test-Path $AppDir)) {
    $ErrMsg = "FATAL: Application directory not found: $AppDir"
    Write-ServerLog $ErrMsg
    Write-Error $ErrMsg
    exit 1
}

$IndexHtmlPath = Join-Path $AppDir "index.html"
if (-not (Test-Path $IndexHtmlPath)) {
    $ErrMsg = "FATAL: index.html not found inside: $AppDir"
    Write-ServerLog $ErrMsg
    Write-Error $ErrMsg
    exit 1
}

# 2. MIME Types
$MimeTypes = @{
    ".html"  = "text/html; charset=utf-8"
    ".htm"   = "text/html; charset=utf-8"
    ".js"    = "application/javascript; charset=utf-8"
    ".mjs"   = "application/javascript; charset=utf-8"
    ".css"   = "text/css; charset=utf-8"
    ".json"  = "application/json; charset=utf-8"
    ".png"   = "image/png"
    ".jpg"   = "image/jpeg"
    ".jpeg"  = "image/jpeg"
    ".gif"   = "image/gif"
    ".svg"   = "image/svg+xml"
    ".webp"  = "image/webp"
    ".ico"   = "image/x-icon"
    ".woff"  = "font/woff"
    ".woff2" = "font/woff2"
    ".ttf"   = "font/ttf"
    ".wasm"  = "application/wasm"
    ".txt"   = "text/plain; charset=utf-8"
}

# 3. Create & Bind HttpListener strictly to 127.0.0.1
$Listener = New-Object System.Net.HttpListener
$Prefix = "http://127.0.0.1:$Port/"
$Listener.Prefixes.Add($Prefix)

try {
    $Listener.Start()
    Write-ServerLog "HttpListener successfully started and listening on $Prefix"
} catch {
    $ErrMsg = "FATAL: Failed to bind HttpListener to $Prefix - $($_.Exception.Message)"
    Write-ServerLog $ErrMsg
    Write-Error $ErrMsg
    exit 2
}

# 4. Request Serving Loop
while ($Listener.IsListening) {
    try {
        $Context = $Listener.GetContext()
        $Request = $Context.Request
        $Response = $Context.Response

        $UrlPath = $Request.Url.LocalPath

        # Health Check Endpoint
        if ($UrlPath -eq "/__museum_health") {
            $HealthBytes = [System.Text.Encoding]::UTF8.GetBytes("MUSEUM_SERVER_READY")
            $Response.ContentType = "text/plain; charset=utf-8"
            $Response.StatusCode = 200
            $Response.Headers.Add("Cache-Control", "no-cache")
            $Response.ContentLength64 = $HealthBytes.Length
            $Response.OutputStream.Write($HealthBytes, 0, $HealthBytes.Length)
            $Response.Close()
            continue
        }

        # Clean requested path
        $CleanPath = $UrlPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($CleanPath)) {
            $CleanPath = "index.html"
        }

        # Normalize relative path to prevent directory traversal
        $SafeRelPath = $CleanPath.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $FilePath = [System.IO.Path]::GetFullPath((Join-Path $AppDir $SafeRelPath))

        # Security check: must reside inside AppDir
        if (-not $FilePath.StartsWith($AppDir, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $FilePath -PathType Leaf)) {
            # SPA Fallback to index.html if route not found
            $FilePath = $IndexHtmlPath
        }

        if (Test-Path $FilePath -PathType Leaf) {
            $Ext = [System.IO.Path]::GetExtension($FilePath).ToLower()
            $ContentType = if ($MimeTypes.ContainsKey($Ext)) { $MimeTypes[$Ext] } else { "application/octet-stream" }
            $Response.ContentType = $ContentType

            # Performance & Caching Headers for Localhost
            $Response.Headers.Add("Cache-Control", "no-cache")
            $Response.Headers.Add("Access-Control-Allow-Origin", "*")

            $Bytes = [System.IO.File]::ReadAllBytes($FilePath)
            $Response.ContentLength64 = $Bytes.Length
            $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
            $Response.StatusCode = 200
        } else {
            $Response.StatusCode = 404
            $ErrBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $Response.OutputStream.Write($ErrBytes, 0, $ErrBytes.Length)
        }

        $Response.Close()
    } catch {
        # Loop continues unless listener stopped or fatal error
    }
}

