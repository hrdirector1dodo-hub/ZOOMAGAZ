# setup_node.ps1
# This script downloads a portable Node.js version, extracts it in the workspace, and updates the PATH.

$NodeVersion = "v20.11.0"
$ZipName = "node-$NodeVersion-win-x64.zip"
$DownloadUrl = "https://nodejs.org/dist/$NodeVersion/$ZipName"
$DestDir = "$PSScriptRoot\node-portable"
$ZipPath = "$PSScriptRoot\$ZipName"

if (-not (Test-Path $DestDir)) {
    New-Item -ItemType Directory -Force -Path $DestDir | Out-Null
}

if (-not (Test-Path "$DestDir\node-$NodeVersion-win-x64\node.exe")) {
    if (-not (Test-Path $ZipPath)) {
        Write-Host "Downloading Node.js $NodeVersion..."
        Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath
    }
    
    Write-Host "Extracting Node.js..."
    Expand-Archive -Path $ZipPath -DestinationPath $DestDir -Force
    
    Write-Host "Cleaning up zip file..."
    Remove-Item -Path $ZipPath -Force
}

$NodeBinPath = "$DestDir\node-$NodeVersion-win-x64"
Write-Host "Node.js is ready at $NodeBinPath"
Write-Host "Add the following path to your environment or use it directly:"
Write-Host $NodeBinPath
