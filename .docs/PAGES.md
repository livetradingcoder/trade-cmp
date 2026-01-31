# LiveTradingLeague - Pages Documentation

## HomePage
**File:** `packages/web/src/pages/HomePage.tsx`

Landing page composed of marketing sections:
- `Hero` - Main hero section with CTA
- `WhyDifferent` - Value proposition
- `HowItWorks` - Platform explanation
- `KeyFeatures` - Feature highlights
- `TheGoal` - Mission statement
- `FAQ` - Frequently asked questions

---

## TournamentsPage
**File:** `packages/web/src/pages/TournamentsPage.tsx`

Main competition browsing page with:

### Features
- Tab filtering by tier (All, Weekly, Bi-Weekly, Monthly)
- Search by competition title
- Affiliate code display banner with copy function
- Tournament cards grid with animations

### Tournament Card Info
- Live badge + tier badge
- Title
- Prize Pool (with tooltip)
- Required Participants (with tooltip)
- Minimum Capital (with tooltip)
- Seats Left (with tooltip)
- Join Competition button (external link)

### Data Source
Uses `useTournaments()` hook from TournamentContext

---

## TermsPage
**File:** `packages/web/src/pages/TermsPage.tsx`

Legal terms and conditions page covering:

### General Terms
1. Company Scope
2. No Brokerage Relationship
3. No Client Funds
4. Competitions
5. Rewards & Prizes
6. No Investment Advice
7. Affiliate & Referral Revenue
8. Limitation of Liability

### Competition Terms
1. Platform Role & Scope
2. Performance Ranking & Winner Selection
3. No Brokerage, No Capital Handling
4. Third-Party Brokers & Independence
5. Affiliate & Referral Relationships
6. No Investment Advice Disclaimer
7. Entertainment & Skill-Based Competition

---

## AdminDashboard
**File:** `packages/web/src/pages/AdminDashboard.tsx`

Full admin interface with authentication.

### Login Screen (when not authenticated)
- Username/password form
- Error handling
- Back to Home button

### Dashboard (when authenticated)

**Sidebar Navigation:**
- Competitions (tournament list)
- Settings (affiliate code)
- Change Password
- Back to Home
- Logout

**Tournament List View:**
- Grid of tournament cards
- Cover image, tier badge
- Prize, capital, participants, seats info
- Edit/Delete actions
- Create Competition button

**Create/Edit Form:**
- Basic Info: Title, Tier, Required Participants
- Prize Pool & Capital section
- Seats Left configuration
- Registration Link (required)
- Image uploads (Cover required, Additional optional)

**Settings View:**
- Affiliate code management
- Displayed on competitions page

**Password Change View:**
- Current password
- New password + confirmation
- Validation (min 6 chars)

---

## Other Pages

### LeaderboardPage
Displays top traders ranking with sample data.

### RiskWarningPage
Risk disclosure for trading activities.

### SecurityPage
Security information about the platform.

### ResetPassword
Password reset form accessed via email token.
