Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
ScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
BaseDir = fso.GetParentFolderName(ScriptDir)
LauncherPs1 = ScriptDir & "\launcher.ps1"

Cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & LauncherPs1 & """"
WshShell.Run Cmd, 0, True
