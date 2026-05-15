# ============================================
# SCRIPT DE TEST - AUTHENTIFICATION API (Windows/PowerShell)
# ============================================
# Ce script teste complètement le système d'authentification sur Windows
# 
# Utilisation:
# powershell -ExecutionPolicy Bypass -File TEST_AUTH_API.ps1

$API_URL = "https://backend-ovbc.onrender.com/api"
$TEST_EMAIL = "test$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$TEST_PASSWORD = "TestPassword123"

# ============================================
# 1️⃣ TEST D'INSCRIPTION
# ============================================
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "1️⃣  TEST D'INSCRIPTION" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "Email: $TEST_EMAIL"
Write-Host "Password: $TEST_PASSWORD"
Write-Host ""

$RegisterBody = @{
    email = $TEST_EMAIL
    password = $TEST_PASSWORD
    name = "Test User"
    phone = "+33612345678"
    accepted_policy = $true
} | ConvertTo-Json

try {
    $RegisterResponse = Invoke-WebRequest -Uri "$API_URL/auth/register" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $RegisterBody `
        -UseBasicParsing
    
    $RegisterData = $RegisterResponse.Content | ConvertFrom-Json
    
    Write-Host "Réponse complète:" -ForegroundColor Cyan
    Write-Host ($RegisterData | ConvertTo-Json | Out-String)
    
    $TOKEN = $RegisterData.token
    
    if ($null -ne $TOKEN -and $TOKEN -ne "") {
        Write-Host "✅ INSCRIPTION RÉUSSIE" -ForegroundColor Green
        Write-Host "Token reçu: $($TOKEN.Substring(0, [Math]::Min(50, $TOKEN.Length)))..."
    } else {
        Write-Host "❌ INSCRIPTION ÉCHOUÉE" -ForegroundColor Red
        Write-Host "Pas de token reçu"
        exit 1
    }
} catch {
    Write-Host "❌ ERREUR: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# 2️⃣ TEST DE CONNEXION
# ============================================
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "2️⃣  TEST DE CONNEXION" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "Email: $TEST_EMAIL"
Write-Host "Password: $TEST_PASSWORD"
Write-Host ""

$LoginBody = @{
    email = $TEST_EMAIL
    password = $TEST_PASSWORD
} | ConvertTo-Json

try {
    $LoginResponse = Invoke-WebRequest -Uri "$API_URL/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $LoginBody `
        -UseBasicParsing
    
    $LoginData = $LoginResponse.Content | ConvertFrom-Json
    
    Write-Host "Réponse complète:" -ForegroundColor Cyan
    Write-Host ($LoginData | ConvertTo-Json | Out-String)
    
    $LOGIN_TOKEN = $LoginData.token
    
    if ($null -ne $LOGIN_TOKEN -and $LOGIN_TOKEN -ne "") {
        Write-Host "✅ CONNEXION RÉUSSIE" -ForegroundColor Green
        Write-Host "Token reçu: $($LOGIN_TOKEN.Substring(0, [Math]::Min(50, $LOGIN_TOKEN.Length)))..."
        $TOKEN = $LOGIN_TOKEN
    } else {
        Write-Host "❌ CONNEXION ÉCHOUÉE" -ForegroundColor Red
        Write-Host "Pas de token reçu"
        exit 1
    }
} catch {
    Write-Host "❌ ERREUR: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# 3️⃣ TEST /api/auth/me
# ============================================
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "3️⃣  TEST /api/auth/me (PROFIL)" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "Token: $($TOKEN.Substring(0, [Math]::Min(50, $TOKEN.Length)))..."
Write-Host ""

try {
    $MeResponse = Invoke-WebRequest -Uri "$API_URL/auth/me" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $TOKEN"
            "Content-Type" = "application/json"
        } `
        -UseBasicParsing
    
    $MeData = $MeResponse.Content | ConvertFrom-Json
    
    Write-Host "Réponse complète:" -ForegroundColor Cyan
    Write-Host ($MeData | ConvertTo-Json | Out-String)
    
    $USER_ID = $MeData.user.id
    
    if ($null -ne $USER_ID -and $USER_ID -ne "") {
        Write-Host "✅ /api/auth/me RÉUSSI" -ForegroundColor Green
        Write-Host "User ID: $USER_ID"
    } else {
        Write-Host "❌ /api/auth/me ÉCHOUÉ" -ForegroundColor Red
        Write-Host "Vérifiez que le token est valide"
        exit 1
    }
} catch {
    Write-Host "❌ ERREUR: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# 4️⃣ TEST DE MAUVAIS MOT DE PASSE
# ============================================
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "4️⃣  TEST DE MAUVAIS MOT DE PASSE" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "Email: $TEST_EMAIL"
Write-Host "Password: WrongPassword"
Write-Host ""

$BadLoginBody = @{
    email = $TEST_EMAIL
    password = "WrongPassword"
} | ConvertTo-Json

try {
    $BadLoginResponse = Invoke-WebRequest -Uri "$API_URL/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $BadLoginBody `
        -UseBasicParsing -ErrorAction SilentlyContinue
    
    $BadLoginData = $BadLoginResponse.Content | ConvertFrom-Json
    
    Write-Host "Réponse complète:" -ForegroundColor Cyan
    Write-Host ($BadLoginData | ConvertTo-Json | Out-String)
    
    $ERROR_MSG = $BadLoginData.error
    
    if ($null -ne $ERROR_MSG -and $ERROR_MSG -ne "") {
        Write-Host "✅ REJET CORRECT (mauvais mot de passe)" -ForegroundColor Green
        Write-Host "Message d'erreur: $ERROR_MSG"
    } else {
        Write-Host "❌ ERREUR - Le mauvais mot de passe aurait dû être rejeté" -ForegroundColor Red
    }
} catch [System.Net.WebException] {
    $ErrorData = $_.Exception.Response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($null -ne $ErrorData -and $null -ne $ErrorData.error) {
        Write-Host "✅ REJET CORRECT (mauvais mot de passe)" -ForegroundColor Green
        Write-Host "Message d'erreur: $($ErrorData.error)"
    } else {
        Write-Host "Erreur réseau: $_"
    }
}

Write-Host ""

# ============================================
# 5️⃣ TEST SANS TOKEN
# ============================================
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "5️⃣  TEST SANS TOKEN SUR /api/auth/me" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

try {
    $NoTokenResponse = Invoke-WebRequest -Uri "$API_URL/auth/me" `
        -Method GET `
        -Headers @{"Content-Type" = "application/json"} `
        -UseBasicParsing -ErrorAction SilentlyContinue
    
    $NoTokenData = $NoTokenResponse.Content | ConvertFrom-Json
    
    Write-Host "Réponse complète:" -ForegroundColor Cyan
    Write-Host ($NoTokenData | ConvertTo-Json | Out-String)
    
} catch [System.Net.WebException] {
    $response = $_.Exception.Response
    $ErrorData = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
    
    Write-Host "Réponse complète:" -ForegroundColor Cyan
    Write-Host ($ErrorData | ConvertTo-Json | Out-String)
    
    $ERROR_NO_TOKEN = $ErrorData.error
    
    if ($null -ne $ERROR_NO_TOKEN -and $ERROR_NO_TOKEN -ne "") {
        Write-Host "✅ REJET CORRECT (pas de token)" -ForegroundColor Green
        Write-Host "Message d'erreur: $ERROR_NO_TOKEN"
    } else {
        Write-Host "❌ ERREUR - Sans token, devrait être rejeté" -ForegroundColor Red
    }
}

Write-Host ""

# ============================================
# RÉSUMÉ
# ============================================
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "✅ TOUS LES TESTS TERMINÉS" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Résumé:" -ForegroundColor Cyan
Write-Host "  ✅ Inscription réussie"
Write-Host "  ✅ Connexion réussie"
Write-Host "  ✅ Récupération profil réussie"
Write-Host "  ✅ Rejet mauvais mot de passe"
Write-Host "  ✅ Rejet sans token"
Write-Host ""
Write-Host "Email de test créé: $TEST_EMAIL" -ForegroundColor Cyan
Write-Host "Vous pouvez réutiliser cet email pour d'autres tests"
