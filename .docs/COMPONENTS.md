# LiveTradingLeague - Components Documentation

## Location
`packages/web/src/components/`

## Layout Components

### Navbar.tsx
Main navigation bar with:
- Logo/brand
- Navigation links
- Admin login button

### Footer.tsx
Page footer with:
- Quick links
- Legal links
- Social links
- Copyright

### Ticker.tsx
Scrolling announcement ticker for promotions.

## Marketing Components

### Hero.tsx
Landing page hero section with:
- Main headline
- Description
- CTA buttons

### WhyDifferent.tsx
Value proposition section explaining platform benefits.

### HowItWorks.tsx
Step-by-step guide on how the platform works.

### KeyFeatures.tsx
Feature cards highlighting platform capabilities.

### TheGoal.tsx
Mission/goal statement section.

### FAQ.tsx
Frequently asked questions accordion.

### ChampionshipHub.tsx
Championship showcase section.

## Functional Components

### Leaderboard.tsx
Top traders ranking display with:
- Rank, name, PnL, ROI
- Streak indicators
- Tier badges

### StatsBar.tsx
Statistics display bar with key metrics.

### ManagerPortal.tsx
Admin login modal for tournament management.
- Username/password form
- Opens AdminDashboard on success

### ImageUpload.tsx
Image upload component for tournaments:
- Drag & drop support
- Preview display
- Uploads to Cloudinary
- Returns secure URL

### ForgotPassword.tsx
Forgot password form component:
- Email input
- Sends reset email

### ModalPortal.tsx
Modal wrapper using React Portal.

## Types
`packages/web/src/types/`

### Tournament
```typescript
interface Tournament {
  id: string | number;
  title: string;
  tier: string;
  prize: string;
  fee: string;
  participants: number;
  timeLabel: string;
  timeLeft: string;
  cover: string;
  image?: string;
  registrationLink: string;
  startingBalance?: string;
  playersJoined?: number;
}
```

### Trader
```typescript
interface Trader {
  rank: number;
  name: string;
  pnl: string;
  roi: string;
  streak: number;
  tier: string;
}
```

## Constants
`packages/web/src/constants/index.ts`

- `ASSETS` - CDN URLs for images
- `CHAMPIONSHIPS` - Fallback tournament data
- `TOP_TRADERS` - Sample leaderboard data
- `TICKER_ITEMS` - Announcement messages
