# ═══════════════════════════════════════════════════════
# Nexus AI Ultra — One-Click Play Store Build Script
# Run this from the AI_Chat_App folder as Administrator
# ═══════════════════════════════════════════════════════

Write-Host "
╔══════════════════════════════════════════╗
║   NEXUS AI ULTRA — PRODUCTION BUILD     ║
║   Play Store Release Generator          ║
╚══════════════════════════════════════════╝
" -ForegroundColor Cyan

# ─── Step 1: Find Java ──────────────────────────────────
Write-Host "[1/5] Detecting Java installation..." -ForegroundColor Yellow

$javaLocations = @(
    "$env:JAVA_HOME\bin\keytool.exe",
    "C:\Program Files\Java\jdk-21\bin\keytool.exe",
    "C:\Program Files\Java\jdk-17\bin\keytool.exe",
    "C:\Program Files\Eclipse Adoptium\jdk-21.0.3.9-hotspot\bin\keytool.exe",
    "C:\Program Files\Microsoft\jdk-21.0.3.9-hotspot\bin\keytool.exe",
    "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
)

$keytool = $null
foreach ($loc in $javaLocations) {
    if (Test-Path $loc) {
        $keytool = $loc
        Write-Host "   ✓ Found keytool at: $loc" -ForegroundColor Green
        break
    }
}

if (-not $keytool) {
    Write-Host "   ✗ Java not found! Installing JDK 21 via winget..." -ForegroundColor Red
    winget install Microsoft.OpenJDK.21 --accept-source-agreements --accept-package-agreements
    $keytool = "C:\Program Files\Microsoft\jdk-21.0.3.9-hotspot\bin\keytool.exe"
    if (-not (Test-Path $keytool)) {
        Write-Host "   ✗ Auto-install failed. Please install Android Studio manually:" -ForegroundColor Red
        Write-Host "   → https://developer.android.com/studio" -ForegroundColor Cyan
        exit 1
    }
}

# ─── Step 2: Generate Keystore ──────────────────────────
$keystorePath = ".\android\app\nexus-release.keystore"
if (-not (Test-Path $keystorePath)) {
    Write-Host "[2/5] Generating signing keystore..." -ForegroundColor Yellow
    & $keytool -genkey -v `
        -keystore $keystorePath `
        -alias "nexus-key" `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -storepass "NexusUltra2026" `
        -keypass "NexusUltra2026" `
        -dname "CN=Ankit Antigravity, OU=Nexus AI, O=Nexus Technologies, L=India, S=IN, C=IN"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Keystore created!" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Keystore generation failed." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[2/5] Keystore already exists — skipping." -ForegroundColor Green
}

# ─── Step 3: Sync web assets ────────────────────────────
Write-Host "[3/5] Syncing latest web assets to Android..." -ForegroundColor Yellow
Copy-Item index.html www/ -Force
Copy-Item style.css www/ -Force
Copy-Item script.js www/ -Force
Copy-Item sw.js www/ -Force
Copy-Item manifest.json www/ -Force
npx cap sync
Write-Host "   ✓ Assets synced!" -ForegroundColor Green

# ─── Step 4: Build Release AAB ──────────────────────────
Write-Host "[4/5] Building Release AAB for Play Store..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat bundleRelease
Set-Location ..

# ─── Step 5: Locate Output ──────────────────────────────
Write-Host "[5/5] Build complete! Checking output..." -ForegroundColor Yellow
$aabPath = "android\app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aabPath) {
    $size = (Get-Item $aabPath).Length / 1MB
    Write-Host "
╔══════════════════════════════════════════╗
║   ✓ BUILD SUCCESSFUL!                   ║
╚══════════════════════════════════════════╝

  📦 File: $aabPath
  📏 Size: $([math]::Round($size, 2)) MB

  ─── NEXT STEPS ──────────────────────────
  1. Go to: https://play.google.com/console
  2. Create new app → 'Nexus AI Ultra'
  3. Upload this .aab file under:
     Production → Create new release

  🔑 KEYSTORE (SAVE THIS SECURELY!):
     Path:     android\app\nexus-release.keystore
     Alias:    nexus-key
     Password: NexusUltra2026
" -ForegroundColor Green
} else {
    Write-Host "
  ✗ Build failed. Try opening Android Studio:
    npx cap open android
  Then: Build → Generate Signed Bundle/APK
" -ForegroundColor Red
}
