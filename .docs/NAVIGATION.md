# LiveTradingLeague - Navigation & Routing

## Route Configuration

Routes are defined in `packages/web/src/App.tsx`

## Public Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | HomePage | Landing page with marketing content |
| `/competitions` | TournamentsPage | Browse and filter tournaments |
| `/leaderboard` | LeaderboardPage | Top traders ranking display |
| `/terms` | TermsPage | Terms of service |
| `/risk-warning` | RiskWarningPage | Risk disclosure |
| `/security` | SecurityPage | Security information |

## Protected/Admin Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/admin` | AdminDashboard | Full admin management (fullscreen, no layout) |
| `/reset-password/:token` | ResetPassword | Password reset form |

## Layout Structure

### Standard Layout (with Navbar/Footer)
- HomePage
- TournamentsPage
- LeaderboardPage
- TermsPage
- RiskWarningPage
- SecurityPage

### Fullscreen Layout (no Navbar/Footer)
- AdminDashboard
- ResetPassword

## Navigation Components

### Navbar (`components/Navbar.tsx`)
- Logo/brand link to home
- Main navigation links
- Admin login button (opens ManagerPortal)

### Footer (`components/Footer.tsx`)
- Quick links to legal pages
- Social links
- Copyright info

## State Management

### TournamentContext
Located at `context/TournamentContext.tsx`

Provides:
```typescript
{
  tournaments: Tournament[]      // All tournaments
  settings: { affiliateCode }    // Platform settings
  isAdmin: boolean               // Auth state
  isLoading: boolean             // Loading state
  login(username, password)      // Login function
  logout()                       // Logout function
  updateTournament(id, data)     // CRUD operations
  createTournament(data)
  deleteTournament(id)
  refreshTournaments()
}
```

## Admin Dashboard Views

The AdminDashboard has internal view modes:

| View | Description |
|------|-------------|
| `list` | Tournament grid with edit/delete actions |
| `create` | Create new tournament form |
| `edit` | Edit existing tournament form |
| `password` | Change admin password |
| `settings` | Platform settings (affiliate code) |
