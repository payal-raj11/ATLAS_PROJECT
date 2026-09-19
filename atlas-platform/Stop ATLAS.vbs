' Stop ATLAS.vbs
'
' Double-click this to stop everything Start ATLAS.vbs started.
' Also invisible -- no window pops up.

Set fso = CreateObject("Scripting.FileSystemObject")
scriptFolder = fso.GetParentFolderName(WScript.ScriptFullName)

Set shell = CreateObject("WScript.Shell")
command = "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & scriptFolder & "\stop-atlas.ps1"""

shell.Run command, 0, True

MsgBox "ATLAS stopped.", 64, "ATLAS"
