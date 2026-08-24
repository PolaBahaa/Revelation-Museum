# ==============================================================================
# Revelation Museum - Portable Kiosk Launcher & Process Manager
# ==============================================================================

$ErrorActionPreference = "SilentlyContinue"

# 1. Resolve Directories
$RuntimeDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BaseDir = Split-Path -Parent $RuntimeDir
$AppDir = Join-Path $BaseDir "app"
$ServerScript = Join-Path $RuntimeDir "server.ps1"

if (-not (Test-Path (Join-Path $AppDir "index.html"))) {
    [System.Windows.Forms.MessageBox]::Show("Error: Museum production build files not found in '$AppDir'.", "Revelation Museum", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
    exit 1
}

# 2. Find Available Localhost Port
function Test-PortAvailable([int]$Port) {
    try {
        $Listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
        $Listener.Start()
        $Listener.Stop()
        return $true
    } catch {
        return $false
    }
}

$Port = 3456
while (-not (Test-PortAvailable $Port) -and $Port -lt 3550) {
    $Port++
}

# 3. Start Local HTTP Server Process in Background (Hidden)
$ServerProcessInfo = New-Object System.Diagnostics.ProcessStartInfo
$ServerProcessInfo.FileName = "powershell.exe"
$ServerProcessInfo.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ServerScript`" -Port $Port -AppDir `"$AppDir`""
$ServerProcessInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
$ServerProcessInfo.CreateNoWindow = $true
$ServerProcessInfo.UseShellExecute = $false

$ServerProcess = [System.Diagnostics.Process]::Start($ServerProcessInfo)

# 4. Wait for Server to be ready
$ServerUrl = "http://127.0.0.1:$Port/"
$MaxRetries = 30
$Ready = $false

for ($i = 0; $i -lt $MaxRetries; $i++) {
    Start-Sleep -Milliseconds 100
    try {
        $Req = [System.Net.WebRequest]::Create($ServerUrl)
        $Req.Timeout = 500
        $Resp = $Req.GetResponse()
        if ($Resp.StatusCode -eq 200) {
            $Ready = $true
            $Resp.Close()
            break
        }
        $Resp.Close()
    } catch {
        # Retry
    }
}

# 5. Detect Chromium-based Browser
$BrowserPaths = @(
    # Microsoft Edge (Standard Windows 10/11 default)
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe",
    "${env:LOCALAPPDATA}\Microsoft\Edge\Application\msedge.exe",
    # Google Chrome
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe",
    # Brave / Chromium
    "${env:ProgramFiles}\BraveSoftware\Brave-Browser\Application\brave.exe",
    "${env:LOCALAPPDATA}\BraveSoftware\Brave-Browser\Application\brave.exe"
)

$SelectedBrowser = $null
foreach ($Path in $BrowserPaths) {
    if (Test-Path $Path) {
        $SelectedBrowser = $Path
        break
    }
}

if (-not $SelectedBrowser) {
    # Clean up server
    if ($ServerProcess -and -not $ServerProcess.HasExited) {
        $ServerProcess.Kill()
    }
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show("A Chromium-based browser (Microsoft Edge or Google Chrome) is required to run the Revelation Museum kiosk.`n`nPlease ensure Microsoft Edge or Google Chrome is installed.", "Revelation Museum", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)
    exit 1
}

# 6. Prepare Kiosk Launch Parameters
$UserDataDir = Join-Path $env:TEMP "RevelationMuseum_Kiosk_$Port"
$BrowserArgs = @(
    "--kiosk",
    "--app=$ServerUrl",
    "--disable-session-crashed-bubble",
    "--no-first-run",
    "--disable-features=Translate,OptimizationHints",
    "--disable-infobars",
    "--hide-scrollbars",
    "--autoplay-policy=no-user-gesture-required",
    "--user-data-dir=`"$UserDataDir`""
) -join " "

# 7. Launch Browser in Kiosk Mode and Monitor
try {
    $BrowserProcess = Start-Process -FilePath $SelectedBrowser -ArgumentList $BrowserArgs -PassThru -Wait
} finally {
    # 8. Clean up Server Process and Temporary Profile
    if ($ServerProcess -and -not $ServerProcess.HasExited) {
        $ServerProcess.Kill()
    }
    if (Test-Path $UserDataDir) {
        Remove-Item -Path $UserDataDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
