# ==============================================================================
# Revelation Museum - Robust Offline Kiosk Launcher & Process Manager
# ==============================================================================

param(
    [switch]$Debug,
    [string]$AppDir = "",
    [string]$RuntimeDir = ""
)

$ErrorActionPreference = "SilentlyContinue"

# 1. Resolve Directories Robustly
if ([string]::IsNullOrEmpty($RuntimeDir)) {
    $RuntimeDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    if ([string]::IsNullOrEmpty($RuntimeDir)) {
        $RuntimeDir = $PSScriptRoot
    }
    if ([string]::IsNullOrEmpty($RuntimeDir)) {
        $RuntimeDir = [System.IO.Path]::Combine((Get-Location).Path, "runtime")
    }
}
$RuntimeDir = [System.IO.Path]::GetFullPath($RuntimeDir)
$BaseDir = Split-Path -Parent $RuntimeDir

if ([string]::IsNullOrEmpty($AppDir)) {
    $AppDir = Join-Path $BaseDir "app"
}
$AppDir = [System.IO.Path]::GetFullPath($AppDir)

$ServerScript = Join-Path $RuntimeDir "server.ps1"
$IndexHtmlPath = Join-Path $AppDir "index.html"

# Helper for showing GUI message box
function Show-GuiMessage([string]$Message, [string]$Title = "Revelation Museum", [string]$Icon = "Error") {
    Add-Type -AssemblyName System.Windows.Forms
    $IconEnum = [System.Windows.Forms.MessageBoxIcon]::$Icon
    [System.Windows.Forms.MessageBox]::Show($Message, $Title, [System.Windows.Forms.MessageBoxButtons]::OK, $IconEnum)
}

# Verify Assets Exist
if (-not (Test-Path $IndexHtmlPath)) {
    $ErrMsg = "Error: Museum production build files not found at expected location:`n`n$AppDir`n`nPlease ensure the complete 'Revelation-Museum' folder was extracted properly."
    Show-GuiMessage -Message $ErrMsg -Title "Revelation Museum - Missing Assets" -Icon "Error"
    exit 1
}

# 2. Port Binding & Health Check Loop
$StartPort = 3456
$EndPort = 3550
$VerifiedPort = 0
$ServerProcess = $null
$Ready = $false
$LastServerError = ""

for ($CandidatePort = $StartPort; $CandidatePort -le $EndPort; $CandidatePort++) {
    $ServerLogFile = Join-Path $env:TEMP "RevelationMuseum_Server_$CandidatePort.log"
    if (Test-Path $ServerLogFile) {
        Remove-Item -Path $ServerLogFile -Force -ErrorAction SilentlyContinue
    }

    # Start candidate server process
    $ServerProcessInfo = New-Object System.Diagnostics.ProcessStartInfo
    $ServerProcessInfo.FileName = "powershell.exe"
    $ServerProcessInfo.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ServerScript`" -Port $CandidatePort -AppDir `"$AppDir`" -LogFile `"$ServerLogFile`""
    $ServerProcessInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
    $ServerProcessInfo.CreateNoWindow = $true
    $ServerProcessInfo.UseShellExecute = $false
    $ServerProcessInfo.WorkingDirectory = $BaseDir

    $CandidateProcess = [System.Diagnostics.Process]::Start($ServerProcessInfo)
    if (-not $CandidateProcess) {
        continue
    }

    # Health poll candidate port
    $HealthUrl = "http://127.0.0.1:$CandidatePort/__museum_health"
    $MaxAttempts = 40 # 40 x 250ms = 10s per port max
    
    for ($attempt = 0; $attempt -lt $MaxAttempts; $attempt++) {
        Start-Sleep -Milliseconds 250

        # If process died early, read log and abandon this port
        if ($CandidateProcess.HasExited) {
            if (Test-Path $ServerLogFile) {
                $LastServerError = Get-Content -Path $ServerLogFile -Raw
            }
            break
        }

        try {
            $Req = [System.Net.HttpWebRequest]::Create($HealthUrl)
            $Req.Proxy = $null
            $Req.Timeout = 600
            $Req.ReadWriteTimeout = 600
            $Resp = $Req.GetResponse()
            
            if ($Resp -and $Resp.StatusCode -eq 200) {
                $Stream = $Resp.GetResponseStream()
                $Reader = New-Object System.IO.StreamReader($Stream)
                $Body = $Reader.ReadToEnd()
                $Reader.Close()
                $Resp.Close()

                if ($Body -match "MUSEUM_SERVER_READY") {
                    $VerifiedPort = $CandidatePort
                    $ServerProcess = $CandidateProcess
                    $Ready = $true
                    break
                }
            }
            if ($Resp) { $Resp.Close() }
        } catch {
            # Connection not ready yet, continue polling
        }
    }

    if ($Ready) {
        break
    } else {
        # Clean up failed candidate process
        if ($CandidateProcess -and -not $CandidateProcess.HasExited) {
            $CandidateProcess.Kill()
        }
    }
}

# 3. Handle Server Failure (NEVER launch browser if server is not verified!)
if (-not $Ready -or $VerifiedPort -eq 0) {
    $DiagMsg = "Failed to start the local Revelation Museum offline server.`n`nNo available port could be bound between $StartPort and $EndPort.`n`nDiagnostics:`n$LastServerError"
    Show-GuiMessage -Message $DiagMsg -Title "Revelation Museum - Server Error" -Icon "Error"
    exit 1
}

# 4. Detect Chromium-based Browser
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
    # Clean up verified server before error exit
    if ($ServerProcess -and -not $ServerProcess.HasExited) {
        $ServerProcess.Kill()
    }
    $BrowserMsg = "A Chromium-based browser (Microsoft Edge or Google Chrome) is required to run the Revelation Museum kiosk.`n`nPlease ensure Microsoft Edge or Google Chrome is installed on this PC."
    Show-GuiMessage -Message $BrowserMsg -Title "Revelation Museum - Browser Required" -Icon "Warning"
    exit 1
}

# 5. Prepare Kiosk Launch Parameters with Isolated Profile
$UserDataDir = Join-Path $env:TEMP "RevelationMuseum_Kiosk_$VerifiedPort"
if (-not (Test-Path $UserDataDir)) {
    [System.IO.Directory]::CreateDirectory($UserDataDir) | Out-Null
}

$ServerUrl = "http://127.0.0.1:$VerifiedPort/"
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

# 6. Launch Browser in Kiosk Mode & Monitor Lifecycle
try {
    $BrowserProcess = Start-Process -FilePath $SelectedBrowser -ArgumentList $BrowserArgs -PassThru -Wait
} finally {
    # 7. Clean up Server Process and Temporary Profile
    if ($ServerProcess -and -not $ServerProcess.HasExited) {
        $ServerProcess.Kill()
    }
    if (Test-Path $UserDataDir) {
        Remove-Item -Path $UserDataDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    if (-not $Debug) {
        $ServerLogFile = Join-Path $env:TEMP "RevelationMuseum_Server_$VerifiedPort.log"
        if (Test-Path $ServerLogFile) {
            Remove-Item -Path $ServerLogFile -Force -ErrorAction SilentlyContinue
        }
    }
}
