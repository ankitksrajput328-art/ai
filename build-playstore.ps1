$ErrorActionPreference = "Continue"

Write-Host "NEXUS AI ULTRA - PLAY STORE BUILD" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

# Step 1: Find Java/keytool
Write-Host "[1/5] Looking for Java..." -ForegroundColor Yellow
$javaLocations = @(
    "$env:JAVA_HOME\bin\keytool.exe",
    "C:\Program Files\Java\jdk-21\bin\keytool.exe",
    "C:\Program Files\Java\jdk-17\bin\keytool.exe",
    "C:\Program Files\Java\jdk-11\bin\keytool.exe",
    "C:\Program Files\Eclipse Adoptium\jdk-21.0.3.9-hotspot\bin\keytool.exe",
    "C:\Program Files\Microsoft\jdk-21.0.3.9-hotspot\bin\keytool.exe",
    "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
)

$keytool = $null
foreach ($loc in $javaLocations) {
    if (Test-Path $loc) {
        $keytool = $loc
        Write-Host "   Found Java: $loc" -ForegroundColor Green
        break
    }
}

if (-not $keytool) {
    Write-Host "   Java not found! Trying winget install..." -ForegroundColor Red
    winget install Microsoft.OpenJDK.21 --accept-source-agreements --accept-package-agreements
    Start-Sleep -Seconds 5
    $keytool = "C:\Program Files\Microsoft\jdk-21.0.3.9-hotspot\bin\keytool.exe"
}

# Step 2: Generate Keystore
$keystorePath = ".\android\app\nexus-release.keystore"
if (-not (Test-Path $keystorePath)) {
    Write-Host "[2/5] Generating signing keystore..." -ForegroundColor Yellow
    if (Test-Path $keytool) {
        & $keytool -genkey -v -keystore $keystorePath -alias "nexus-key" -keyalg RSA -keysize 2048 -validity 10000 -storepass "NexusUltra2026" -keypass "NexusUltra2026" -dname "CN=Ankit Antigravity, OU=Nexus AI, O=Nexus Technologies, L=India, S=IN, C=IN"
        Write-Host "   Keystore created!" -ForegroundColor Green
    } else {
        Write-Host "   SKIP: Java not installed. Open Android Studio to generate keystore." -ForegroundColor Yellow
    }
} else {
    Write-Host "[2/5] Keystore exists." -ForegroundColor Green
}

# Step 3: Sync web assets
Write-Host "[3/5] Syncing web assets..." -ForegroundColor Yellow
Copy-Item index.html www -Force
Copy-Item style.css www -Force
Copy-Item script.js www -Force
Copy-Item sw.js www -Force
Copy-Item manifest.json www -Force
npx cap sync
Write-Host "   Sync done!" -ForegroundColor Green

# Step 4: Build Release AAB
Write-Host "[4/5] Building release AAB..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat bundleRelease
Set-Location ..

# Step 5: Check output
Write-Host "[5/5] Checking build output..." -ForegroundColor Yellow
$aabPath = "android\app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aabPath) {
    $size = [math]::Round((Get-Item $aabPath).Length / 1MB, 2)
    Write-Host "BUILD SUCCESS!" -ForegroundColor Green
    Write-Host "AAB File: $aabPath ($size MB)" -ForegroundColor Green
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "1. Visit: https://play.google.com/console" -ForegroundColor White
    Write-Host "2. Create app: Nexus AI Ultra (com.nexus.ultra)" -ForegroundColor White
    Write-Host "3. Upload: android\app\build\outputs\bundle\release\app-release.aab" -ForegroundColor White
    Write-Host ""
    Write-Host "KEYSTORE (save securely!):" -ForegroundColor Yellow
    Write-Host "  Path:     android\app\nexus-release.keystore" -ForegroundColor White
    Write-Host "  Alias:    nexus-key" -ForegroundColor White
    Write-Host "  Password: NexusUltra2026" -ForegroundColor White
} else {
    Write-Host "Build failed or Java not installed." -ForegroundColor Red
    Write-Host "Alternative: Run 'npx cap open android' and use Android Studio." -ForegroundColor Yellow
}
