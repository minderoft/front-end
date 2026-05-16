# LocaPlus Phase 5: Professional Features - Deployment Guide

## Overview
This guide walks through deploying the professional feature suite: favorites, reviews/ratings, verification badges, IP tracking, boost monetization, and advanced filters.

---

## 1. Database Migration (Neon PostgreSQL)

### Step 1.1: Add Security & UX Columns

```bash
# Via Neon console (https://console.neon.tech)
# OR via psql terminal:

psql -h [NEON_HOST] -U [NEON_USER] -d [DB_NAME] << 'EOF'

BEGIN;

-- Add verification badge column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Add IP tracking for double-auth prep
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_ip VARCHAR(45);

-- Add last login timestamp
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Ensure boost columns exist (likely already present)
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT FALSE;

ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS boost_expiry TIMESTAMP;

COMMIT;

EOF
```

### Step 1.2: Verify Columns

```sql
-- Check users table
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check announcements table
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'announcements' 
ORDER BY ordinal_position;
```

---

## 2. Backend Deployment

### Step 2.1: Files Changed

The following backend files have been updated to PostgreSQL syntax and added new functionality:

| File | Changes |
|------|---------|
| `backend/middleware/ipTracking.js` | NEW - IP tracking & last login timestamp |
| `backend/routes/admin.js` | NEW - Admin verification & boost endpoints |
| `backend/routes/announcements.js` | MySQL → PostgreSQL syntax conversion |
| `backend/routes/favorites.js` | MySQL → PostgreSQL syntax conversion + new check endpoint |
| `backend/routes/reviews.js` | MySQL → PostgreSQL syntax conversion + announcement reviews endpoint |
| `backend/server.js` | Integrated IP tracking + admin routes |

### Step 2.2: Deploy to Render

```bash
cd backend

# Commit changes
git add -A
git commit -m "Phase 5: Add professional features - favorites, reviews, verification, IP tracking, boost"

# Push to Render (auto-deploy)
git push origin main

# Verify deployment (check Render logs)
# https://dashboard.render.com/services/[SERVICE_ID]
```

### Step 2.3: Test Backend Endpoints

```powershell
# Run the test suite (PowerShell)
.\TEST_PHASE5_FEATURES.ps1
```

**Expected Output:**
- ✅ LOGIN SUCCESS
- ✅ FAVORITES ADDED/RETRIEVED
- ✅ REVIEWS SUBMITTED/RETRIEVED
- ✅ ANNOUNCEMENTS DETAIL (includes is_verified, average_rating, etc.)

---

## 3. Frontend Integration

### Step 3.1: New Components Created

```
front-end/src/
├── components/
│   ├── VerificationBadge.jsx       (NEW)
│   ├── BoostedBadge.jsx            (NEW)
├── pages/
│   ├── Favorites.jsx               (NEW)
└── styles/
    ├── Favorites.css               (NEW)
    ├── VerificationBadge.css       (NEW)
    ├── BoostedBadge.css            (NEW)
```

### Step 3.2: Update Announcements Page

**File: `front-end/src/pages/Announcements.jsx`**

Add imports:
```jsx
import VerificationBadge from '../components/VerificationBadge';
import BoostedBadge from '../components/BoostedBadge';
```

Update announcement card rendering:
```jsx
<div className="announcement-card">
  {/* Image section */}
  <div className="announcement-image">
    <img src={imageUrl} alt={title} />
    <BoostedBadge isBoosted={announcement.is_boosted} boostExpiry={announcement.boost_expiry} />
  </div>

  {/* Info section */}
  <div className="announcement-info">
    <h3>{title}</h3>
    
    {/* Seller info with verification */}
    <div className="seller-info">
      <span>{announcement.user_name}</span>
      <VerificationBadge isVerified={announcement.is_verified} />
    </div>

    {/* Rating */}
    <div className="rating">
      {'⭐'.repeat(Math.round(announcement.average_rating))}
      <span>({announcement.review_count} reviews)</span>
    </div>

    <p className="price">{announcement.price.toLocaleString('fr-CI')} FCFA</p>
  </div>

  {/* Action buttons */}
  <div className="announcement-actions">
    <button onClick={() => navigate(`/announcements/${announcement.id}`)}>Voir</button>
    <button onClick={() => handleToggleFavorite(announcement.id)} 
            className={isFavorited ? 'favorited' : ''}>
      {isFavorited ? '❤️ Favori' : '🤍 Ajouter'}
    </button>
  </div>
</div>
```

### Step 3.3: Update AnnouncementDetail Page

**File: `front-end/src/pages/AnnouncementDetail.jsx`**

Add after seller card:
```jsx
{/* Reviews section */}
<section className="reviews-section">
  <h3>⭐ Avis Clients</h3>
  <div className="rating-summary">
    <div className="average-rating">
      {announcement.average_rating}
      <span className="stars">{'⭐'.repeat(Math.round(announcement.average_rating))}</span>
    </div>
    <p className="review-count">Basé sur {announcement.review_count} avis</p>
  </div>

  {/* Review submission form */}
  {isAuthenticated && req.user.id !== announcement.user_id && (
    <form onSubmit={handleSubmitReview} className="review-form">
      <h4>Laisser un avis</h4>
      <div className="rating-input">
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} type="button" 
            onClick={() => setReviewRating(star)}
            className={star <= reviewRating ? 'selected' : ''}>
            ⭐
          </button>
        ))}
      </div>
      <textarea placeholder="Votre avis..." value={reviewComment} 
        onChange={(e) => setReviewComment(e.target.value)} />
      <button type="submit" className="btn-submit">Envoyer mon avis</button>
    </form>
  )}

  {/* Display reviews */}
  <div className="reviews-list">
    {reviews.map(review => (
      <div key={review.id} className="review-item">
        <div className="review-header">
          <strong>{review.reviewer_name}</strong>
          <span className="rating">{'⭐'.repeat(review.rating)}</span>
        </div>
        <p className="review-comment">{review.comment}</p>
        <span className="review-date">
          {new Date(review.created_at).toLocaleDateString('fr-CI')}
        </span>
      </div>
    ))}
  </div>
</section>

{/* Boost section */}
{isAuthenticated && req.user.id === announcement.user_id && !announcement.is_boosted && (
  <div className="boost-section">
    <h3>🚀 Booster cette annonce</h3>
    <p>Augmentez la visibilité de votre annonce pour 24 heures</p>
    <button onClick={() => handleBoostAnnouncement(announcement.id)}>
      Acheter un boost
    </button>
  </div>
)}
```

### Step 3.4: Update Navbar

**File: `front-end/src/components/Navbar.jsx`**

Add favorites link:
```jsx
<nav>
  {/* ... existing links ... */}
  
  {isAuthenticated && (
    <>
      <Link to="/favorites" className="nav-link">
        ♥ Favoris
        {favoriteCount > 0 && <span className="badge">{favoriteCount}</span>}
      </Link>
      {user?.is_verified && (
        <span className="admin-badge" title="Vendeur vérifié">✓ Vérifié</span>
      )}
    </>
  )}
</nav>
```

### Step 3.5: Add Routes in App.jsx

```jsx
import Favorites from './pages/Favorites';

// In the route list:
<Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
```

### Step 3.6: Deploy Frontend to Vercel

```bash
cd front-end

# Commit changes
git add -A
git commit -m "Phase 5: Add favorites, reviews, verification badges, boost UI"

# Push to Vercel (auto-deploy)
git push origin main

# Verify deployment (check Vercel logs)
# https://vercel.com/dashboard
```

---

## 4. Environment Variables

### Backend (.env on Render)

Ensure these are set:

```
DATABASE_URL=postgresql://user:pass@neon.tech/db
JWT_SECRET=[YOUR_SECRET]
PAYSTACK_PUBLIC_KEY=[YOUR_KEY]
PAYSTACK_SECRET_KEY=[YOUR_KEY]
PAYSTACK_WEBHOOK_SECRET=[YOUR_SECRET]
FRONTEND_URL=https://loca-plus-hub.vercel.app
NODE_ENV=production
PORT=10000
```

### Frontend (.env in front-end/)

```
VITE_API_URL=https://backend-ovbc.onrender.com/api
```

---

## 5. Feature Validation Checklist

### Favorites (✅ Ready)
- [ ] User can add announcement to favorites → GET /api/favorites shows it
- [ ] User can remove from favorites
- [ ] Favorites page displays correctly with grid layout
- [ ] Favorite count badge shows in Navbar

### Reviews (✅ Ready)
- [ ] User can submit review (1-5 stars + comment)
- [ ] Cannot self-review
- [ ] Average rating displays on seller profile
- [ ] Review count updates correctly
- [ ] Reviews appear on announcement detail page

### Verification Badges (✅ Ready)
- [ ] Green checkmark appears on verified sellers
- [ ] Badge responsive to `user.is_verified` field
- [ ] Admin can mark user as verified (if admin)
- [ ] Appears on announcement cards and detail page

### Boost Monetization (✅ Ready)
- [ ] Boosted announcements appear first in listings
- [ ] 🚀 "Sponsorisé" badge shows on boosted announcements
- [ ] Boost expiry validation works
- [ ] Payment flow redirects to Paystack correctly
- [ ] On payment success: announcement is boosted for 24h

### IP Tracking (✅ Ready)
- [ ] `last_ip` and `last_login_at` are updated on login
- [ ] Data stored in database
- [ ] Ready for double-auth implementation

### Advanced Filters (⏳ TODO)
- [ ] Add city dropdown filter to Announcements page
- [ ] Add price range slider
- [ ] Add condition filter (New/Used)
- [ ] Add seller rating filter

---

## 6. Testing Flow

### Test 1: Anonymous User
```
1. Go to Announcements page
2. See boosted announcements at top
3. See verification badges on sellers
4. See average ratings
5. Try to favorite → redirects to login
```

### Test 2: Authenticated User
```
1. Login with test account
2. Click favorite on an announcement → heart fills ❤️
3. Go to Favorites page → see saved announcements
4. Click on announcement → see reviews section
5. Leave 5-star review with comment
6. Go back to Announcements → see new review count
7. If seller: see "Boost" button → click → Paystack modal
8. If admin: go to seller profile → see "Verify" button
```

### Test 3: Seller Features
```
1. Login as seller
2. See "Mes Annonces" dashboard
3. For each announcement: see "Boost Now" button
4. Click boost → redirected to payment
5. Simulate payment success
6. Return to Announcements → ad is now 🚀 Sponsorisé
7. Ad appears at top of list
```

---

## 7. Rollback Plan

If issues occur:

```bash
# Backend rollback (Render)
git revert [COMMIT_HASH]
git push origin main
# Render auto-redeployed (monitor logs)

# Frontend rollback (Vercel)
# Via Vercel dashboard: Deployments → click previous successful version → Promote to Production

# Database rollback (Neon)
# If migration failed:
ALTER TABLE users DROP COLUMN is_verified;
ALTER TABLE users DROP COLUMN last_ip;
ALTER TABLE users DROP COLUMN last_login_at;
```

---

## 8. Performance Considerations

### Database Queries
- Reviews lookup includes `LIMIT 10` (avoid N+1 queries)
- Announcements sorted by `is_boosted DESC, created_at DESC` (indexed on both)
- Favorites joined efficiently with `LEFT JOIN`

### Frontend Caching
- User favorites cached in component state (refetch on add/remove)
- Announcement detail reviews fetched once on mount
- Verification badges are lightweight (no API call)

### API Rate Limiting
- Already enforced: 100 req/15min general, 10 req/15min for auth
- Favorites/reviews endpoints subject to general limit

---

## 9. Post-Deployment Monitoring

### Check Logs
```bash
# Render backend logs
curl https://backend-ovbc.onrender.com/api/health

# Expected response
{
  "status": "OK",
  "database": { "connected": true },
  "timestamp": "..."
}
```

### Monitor Metrics
- Paystack payment volume (check Paystack dashboard)
- Verified users count (SQL: `SELECT COUNT(*) FROM users WHERE is_verified = TRUE`)
- Boosted announcements active (SQL: `SELECT COUNT(*) FROM announcements WHERE is_boosted = TRUE AND boost_expiry > NOW()`)

---

## 10. Next Phase (Phase 5.2)

### UI/UX Enhancements
- Advanced filters: city, condition, seller rating
- Search suggestion autocomplete
- Mobile-friendly boost payment flow
- Notification badges for new reviews/messages

### Security Enhancements
- Email verification for seller accounts
- Double-auth on new IP detection (use `last_ip` data)
- Admin dashboard for user verification requests

### Monetization Expansion
- Commission tracking on boost purchases
- Subscription plans (Premium seller = auto-boost)
- Featured listings section

---

**Document Status:** ✅ Phase 5 Deployment Ready  
**Last Updated:** Current Session  
**Contact:** LocaPlus Support Team
