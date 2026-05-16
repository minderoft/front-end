#!/usr/bin/env pwsh
# Script de test pour les fonctionnalités Favoris, Avis, Boost et Vérification

# Configuration
$BACKEND_URL = "https://backend-ovbc.onrender.com/api"
$TEST_USER_EMAIL = "test@locaplus.ci"
$TEST_USER_PASSWORD = "Password123!"
$TEST_ANNOUNCEMENT_ID = ""
$TOKEN = ""
$USER_ID = ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LocaPlus API - Phase 5 Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. AUTH & TOKEN
# ============================================

Write-Host "[1/7] Testing Authentication..." -ForegroundColor Yellow

try {
  $loginResponse = Invoke-WebRequest `
    -Uri "$BACKEND_URL/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body (ConvertTo-Json @{
      email = $TEST_USER_EMAIL
      password = $TEST_USER_PASSWORD
    }) `
    -ErrorAction Stop

  $loginData = $loginResponse.Content | ConvertFrom-Json
  $TOKEN = $loginData.token
  $USER_ID = $loginData.user.id

  if ($TOKEN) {
    Write-Host "✅ LOGIN SUCCESS - Token received" -ForegroundColor Green
    Write-Host "   User ID: $USER_ID" -ForegroundColor Green
    Write-Host "   Token: $($TOKEN.Substring(0, 20))..." -ForegroundColor Green
  } else {
    Write-Host "❌ LOGIN FAILED - No token" -ForegroundColor Red
    exit 1
  }
} catch {
  Write-Host "❌ LOGIN ERROR: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

# ============================================
# 2. GET ANNOUNCEMENTS (to find test announcement)
# ============================================

Write-Host "`n[2/7] Fetching Announcements..." -ForegroundColor Yellow

try {
  $announcementsResponse = Invoke-WebRequest `
    -Uri "$BACKEND_URL/announcements?limit=5" `
    -Method GET `
    -Headers @{ "Authorization" = "Bearer $TOKEN" } `
    -ErrorAction Stop

  $announcementsData = $announcementsResponse.Content | ConvertFrom-Json
  if ($announcementsData.announcements.Count -gt 0) {
    $TEST_ANNOUNCEMENT_ID = $announcementsData.announcements[0].id
    $SELLER_ID = $announcementsData.announcements[0].user_id
    Write-Host "✅ ANNOUNCEMENTS FETCHED" -ForegroundColor Green
    Write-Host "   Test Announcement: $($announcementsData.announcements[0].title)" -ForegroundColor Green
    Write-Host "   ID: $TEST_ANNOUNCEMENT_ID" -ForegroundColor Green
    Write-Host "   Seller: $SELLER_ID" -ForegroundColor Green
  } else {
    Write-Host "⚠️  NO ANNOUNCEMENTS FOUND" -ForegroundColor Yellow
  }
} catch {
  Write-Host "❌ ANNOUNCEMENTS ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# 3. TEST FAVORITES
# ============================================

Write-Host "`n[3/7] Testing Favorites..." -ForegroundColor Yellow

if ($TEST_ANNOUNCEMENT_ID) {
  # ADD TO FAVORITES
  try {
    $favoriteResponse = Invoke-WebRequest `
      -Uri "$BACKEND_URL/favorites/$TEST_ANNOUNCEMENT_ID" `
      -Method POST `
      -Headers @{ "Authorization" = "Bearer $TOKEN" } `
      -ContentType "application/json" `
      -Body "{}" `
      -ErrorAction Stop

    Write-Host "✅ FAVORITE ADDED" -ForegroundColor Green
  } catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
      Write-Host "⚠️  FAVORITE ALREADY EXISTS (expected)" -ForegroundColor Yellow
    } else {
      Write-Host "❌ ADD FAVORITE ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
  }

  # GET FAVORITES
  try {
    $favoritesResponse = Invoke-WebRequest `
      -Uri "$BACKEND_URL/favorites" `
      -Method GET `
      -Headers @{ "Authorization" = "Bearer $TOKEN" } `
      -ErrorAction Stop

    $favoritesData = $favoritesResponse.Content | ConvertFrom-Json
    Write-Host "✅ FAVORITES LIST RETRIEVED" -ForegroundColor Green
    Write-Host "   Count: $($favoritesData.favorites.Count)" -ForegroundColor Green
  } catch {
    Write-Host "❌ GET FAVORITES ERROR: $($_.Exception.Message)" -ForegroundColor Red
  }

  # CHECK IF FAVORITED
  try {
    $checkResponse = Invoke-WebRequest `
      -Uri "$BACKEND_URL/favorites/check/$TEST_ANNOUNCEMENT_ID" `
      -Method GET `
      -Headers @{ "Authorization" = "Bearer $TOKEN" } `
      -ErrorAction Stop

    $checkData = $checkResponse.Content | ConvertFrom-Json
    Write-Host "✅ FAVORITE STATUS: $($checkData.isFavorited)" -ForegroundColor Green
  } catch {
    Write-Host "❌ CHECK FAVORITE ERROR: $($_.Exception.Message)" -ForegroundColor Red
  }
}

# ============================================
# 4. TEST REVIEWS
# ============================================

Write-Host "`n[4/7] Testing Reviews..." -ForegroundColor Yellow

if ($TEST_ANNOUNCEMENT_ID) {
  # POST REVIEW
  try {
    $reviewResponse = Invoke-WebRequest `
      -Uri "$BACKEND_URL/reviews" `
      -Method POST `
      -Headers @{ "Authorization" = "Bearer $TOKEN" } `
      -ContentType "application/json" `
      -Body (ConvertTo-Json @{
        announcementId = $TEST_ANNOUNCEMENT_ID
        rating = 5
        comment = "Excellent service! Très satisfait."
      }) `
      -ErrorAction Stop

    $reviewData = $reviewResponse.Content | ConvertFrom-Json
    Write-Host "✅ REVIEW SUBMITTED" -ForegroundColor Green
    Write-Host "   Message: $($reviewData.message)" -ForegroundColor Green
  } catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
      Write-Host "⚠️  REVIEW ALREADY SUBMITTED (expected if test run multiple times)" -ForegroundColor Yellow
    } else {
      Write-Host "❌ POST REVIEW ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
  }

  # GET REVIEWS FOR SELLER
  if ($SELLER_ID) {
    try {
      $sellerReviewsResponse = Invoke-WebRequest `
        -Uri "$BACKEND_URL/reviews/user/$SELLER_ID" `
        -Method GET `
        -ErrorAction Stop

      $sellerReviewsData = $sellerReviewsResponse.Content | ConvertFrom-Json
      Write-Host "✅ SELLER REVIEWS RETRIEVED" -ForegroundColor Green
      Write-Host "   Average Rating: $($sellerReviewsData.average_rating) ⭐" -ForegroundColor Green
      Write-Host "   Total Reviews: $($sellerReviewsData.total_reviews)" -ForegroundColor Green
    } catch {
      Write-Host "❌ GET SELLER REVIEWS ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
  }

  # GET REVIEWS FOR ANNOUNCEMENT
  try {
    $announcementReviewsResponse = Invoke-WebRequest `
      -Uri "$BACKEND_URL/reviews/announcement/$TEST_ANNOUNCEMENT_ID" `
      -Method GET `
      -ErrorAction Stop

    $announcementReviewsData = $announcementReviewsResponse.Content | ConvertFrom-Json
    Write-Host "✅ ANNOUNCEMENT REVIEWS RETRIEVED" -ForegroundColor Green
    Write-Host "   Count: $($announcementReviewsData.reviews.Count)" -ForegroundColor Green
  } catch {
    Write-Host "❌ GET ANNOUNCEMENT REVIEWS ERROR: $($_.Exception.Message)" -ForegroundColor Red
  }
}

# ============================================
# 5. TEST BOOST (Info only, don't actually charge)
# ============================================

Write-Host "`n[5/7] Testing Boost Payment Info..." -ForegroundColor Yellow

try {
  $paymentConfigResponse = Invoke-WebRequest `
    -Uri "$BACKEND_URL/payment/config" `
    -Method GET `
    -ErrorAction Stop

  $paymentConfigData = $paymentConfigResponse.Content | ConvertFrom-Json
  Write-Host "✅ PAYMENT CONFIG RETRIEVED" -ForegroundColor Green
  Write-Host "   Paystack Configured: $($paymentConfigData.isConfigured)" -ForegroundColor Green
} catch {
  Write-Host "⚠️  PAYMENT CONFIG ERROR (may not be critical): $($_.Exception.Message)" -ForegroundColor Yellow
}

# ============================================
# 6. TEST ADMIN ENDPOINTS (verification)
# ============================================

Write-Host "`n[6/7] Testing Admin Endpoints..." -ForegroundColor Yellow

try {
  # Try to verify a user (will likely fail with 403 if not admin)
  $verifyResponse = Invoke-WebRequest `
    -Uri "$BACKEND_URL/admin/users/$USER_ID/verify" `
    -Method PUT `
    -Headers @{ "Authorization" = "Bearer $TOKEN" } `
    -ContentType "application/json" `
    -Body (ConvertTo-Json @{ isVerified = $true }) `
    -ErrorAction Stop

  Write-Host "✅ USER VERIFICATION SUCCESS (You are admin!)" -ForegroundColor Green
} catch {
  if ($_.Exception.Response.StatusCode -eq 403) {
    Write-Host "⚠️  USER VERIFICATION FORBIDDEN (expected if not admin)" -ForegroundColor Yellow
  } else {
    Write-Host "⚠️  ADMIN ENDPOINT ERROR: $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

# ============================================
# 7. ANNOUNCEMENT DETAIL CHECK
# ============================================

Write-Host "`n[7/7] Checking Announcement Detail Structure..." -ForegroundColor Yellow

if ($TEST_ANNOUNCEMENT_ID) {
  try {
    $detailResponse = Invoke-WebRequest `
      -Uri "$BACKEND_URL/announcements/$TEST_ANNOUNCEMENT_ID" `
      -Method GET `
      -Headers @{ "Authorization" = "Bearer $TOKEN" } `
      -ErrorAction Stop

    $detailData = $detailResponse.Content | ConvertFrom-Json
    $announcement = $detailData.announcement

    Write-Host "✅ ANNOUNCEMENT DETAIL RETRIEVED" -ForegroundColor Green
    Write-Host "   Title: $($announcement.title)" -ForegroundColor Green
    Write-Host "   Has is_verified: $(if ($announcement.is_verified) { 'YES ✓' } else { 'NO' })" -ForegroundColor Green
    Write-Host "   Has is_boosted: $(if ($announcement.is_boosted) { 'YES ✓' } else { 'NO' })" -ForegroundColor Green
    Write-Host "   Average Rating: $($announcement.average_rating) ⭐" -ForegroundColor Green
    Write-Host "   Review Count: $($announcement.review_count)" -ForegroundColor Green
    Write-Host "   Has image_url: $(if ($announcement.image_url) { 'YES ✓' } else { 'NO' })" -ForegroundColor Green
  } catch {
    Write-Host "❌ ANNOUNCEMENT DETAIL ERROR: $($_.Exception.Message)" -ForegroundColor Red
  }
}

# ============================================
# SUMMARY
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ Test Suite Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run MIGRATE_RSI_SECURITY.sql on Neon (if not done)" -ForegroundColor Yellow
Write-Host "2. Integrate Favorites, Boost, and Review components in frontend" -ForegroundColor Yellow
Write-Host "3. Test in browser at https://loca-plus-hub.vercel.app" -ForegroundColor Yellow
