# ==============================================================================
# Revelation Museum - Portable Offline Static HTTP Server
# Bound strictly to 127.0.0.1 (Localhost Only)
# ==============================================================================

param(
    [int]$Port = 3456,
    [string]$AppDir = ""
)

if ([string]::IsNullOrEmpty($AppDir)) {
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $AppDir = Join-Path (Split-Path -Parent $ScriptDir) "app"
}

if (-not (Test-Path $AppDir)) {
    Write-Error "Application directory not found: $AppDir"
    exit 1
}

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

$Listener = New-Object System.Net.HttpListener
$Prefix = "http://127.0.0.1:$Port/"
$Listener.Prefixes.Add($Prefix)

try {
    $Listener.Start()
} catch {
    Write-Error "Failed to bind HttpListener to $Prefix: $_"
    exit 1
}

while ($Listener.IsListening) {
    try {
        $Context = $Listener.GetContext()
        $Request = $Context.Request
        $Response = $Context.Response

        $UrlPath = $Request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($UrlPath)) {
            $UrlPath = "index.html"
        }

        # Normalize relative path to prevent directory traversal
        $SafeRelPath = $UrlPath.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $FilePath = [System.IO.Path]::GetFullPath((Join-Path $AppDir $SafeRelPath))

        # Security check: must reside inside AppDir
        if (-not $FilePath.StartsWith($AppDir, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $FilePath -PathType Leaf)) {
            # SPA Fallback to index.html if route not found
            $FilePath = Join-Path $AppDir "index.html"
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
        # Loop continues until listener is stopped
    }
}
