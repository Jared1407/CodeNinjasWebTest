# bundle.ps1 - Create a portable distribution of Code Ninjas Dashboard
# Run this script to create a ZIP file with everything needed

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CODE NINJAS DASHBOARD - BUNDLE CREATOR" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$distDir = Join-Path $projectDir "dist"
$bundleDir = Join-Path $distDir "CodeNinjasDashboard"
$nodeVersion = "20.11.0"
$nodeZip = "node-v$nodeVersion-win-x64.zip"
$nodeUrl = "https://nodejs.org/dist/v$nodeVersion/$nodeZip"

# Create dist directory
if (Test-Path $bundleDir) {
    Write-Host "Cleaning existing bundle..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $bundleDir
}
New-Item -ItemType Directory -Path $bundleDir | Out-Null

Write-Host "Step 1/4: Copying project files..." -ForegroundColor Green

# Copy necessary files (excluding dev files)
$filesToCopy = @(
    "server.js",
    "Document.html",
    "styles.css",
    "main.js",
    "ui.js",
    "auth.js",
    "admin.js",
    "config.js",
    "database.js",
    "data.json",
    "senseis.json",
    "package.json",
    "start.bat"
)

foreach ($file in $filesToCopy) {
    $src = Join-Path $projectDir $file
    if (Test-Path $src) {
        Copy-Item $src $bundleDir
        Write-Host "  Copied: $file" -ForegroundColor DarkGray
    }
}

# Copy Themes folder
$themesDir = Join-Path $projectDir "Themes"
if (Test-Path $themesDir) {
    Copy-Item -Recurse $themesDir (Join-Path $bundleDir "Themes")
    Write-Host "  Copied: Themes/" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Step 2/4: Copying node_modules..." -ForegroundColor Green
$nodeModulesSrc = Join-Path $projectDir "node_modules"
$nodeModulesDst = Join-Path $bundleDir "node_modules"
Copy-Item -Recurse $nodeModulesSrc $nodeModulesDst
Write-Host "  Copied node_modules (this may take a moment)" -ForegroundColor DarkGray

Write-Host ""
Write-Host "Step 3/4: Downloading portable Node.js v$nodeVersion..." -ForegroundColor Green
$nodeDownloadPath = Join-Path $distDir $nodeZip
$nodeExtractDir = Join-Path $bundleDir "node"

if (!(Test-Path $nodeDownloadPath)) {
    Write-Host "  Downloading from nodejs.org..." -ForegroundColor DarkGray
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeDownloadPath -UseBasicParsing
}

Write-Host "  Extracting Node.js..." -ForegroundColor DarkGray
Expand-Archive -Path $nodeDownloadPath -DestinationPath $distDir -Force

# Move node files to bundle
$extractedNodeDir = Join-Path $distDir "node-v$nodeVersion-win-x64"
New-Item -ItemType Directory -Path $nodeExtractDir | Out-Null
Copy-Item (Join-Path $extractedNodeDir "node.exe") $nodeExtractDir
Write-Host "  Node.js ready!" -ForegroundColor DarkGray

Write-Host ""
Write-Host "Step 4/4: Creating ZIP archive..." -ForegroundColor Green
$zipPath = Join-Path $distDir "CodeNinjasDashboard-Portable.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}
# Small delay to ensure files are released
Start-Sleep -Seconds 2
Compress-Archive -Path "$bundleDir\*" -DestinationPath $zipPath -CompressionLevel Fastest

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  BUNDLE CREATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Output: $zipPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "To use on another computer:" -ForegroundColor Yellow
Write-Host "  1. Copy the ZIP file to the target computer"
Write-Host "  2. Extract the ZIP to any folder"
Write-Host "  3. Double-click 'start.bat' to run"
Write-Host "  4. Open http://localhost:3000 in a browser"
Write-Host ""

# Show size
$zipSize = (Get-Item $zipPath).Length / 1MB
Write-Host "Bundle size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor DarkGray
Write-Host ""
