' Start ATLAS.vbs
'
' Double-click this file to start the whole ATLAS platform with
' zero visible windows -- no terminals, no console flashes, nothing.
' After about 15-20 seconds it opens your browser to the login page
' automatically.
'
' If something doesn't come up, check the "logs" folder that appears
' next to this file -- each app writes its own log there.

Set fso = CreateObject("Scripting.FileSystemObject")
scriptFolder = fso.GetParentFolderName(WScript.ScriptFullName)

Set shell = CreateObject("WScript.Shell")
command = "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & scriptFolder & "\start-atlas-silent.ps1"""

' The "0" hides the window completely. The "False" means don't wait
' for it to finish -- it keeps running in the background.
shell.Run command, 0, False
