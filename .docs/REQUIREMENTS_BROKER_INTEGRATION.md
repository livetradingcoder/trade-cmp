# LiveTradingLeague - Broker Integration & User Flow Requirements

## Document Info
- **Version:** 1.0
- **Date:** January 2026
- **Status:** Draft for Stakeholder Review
- **Broker Partner:** FP Markets

---

## 1. Executive Summary

This document outlines the technical requirements for integrating FP Markets broker data to power the LiveTradingLeague competition platform. It covers user registration flows, tournament participation, leaderboard data requirements, and admin management capabilities.

---

## 2. High-Level System Architecture

```mermaid
flowchart TB
    subgraph "LiveTradingLeague Platform"
        WEB[Web Application]
        API[Backend API]
        DB[(MongoDB)]
    end

    subgraph "FP Markets"
        BROKER_API[Broker API]
        BROKER_DB[(Trading Data)]
    end

    subgraph "Users"
        NEW[New Users]
        EXISTING[Existing Users]
    end

    NEW -->|1. Register via Referral| BROKER_API
    NEW -->|2. Join Competition| WEB
    EXISTING -->|Join Competition| WEB
    WEB --> API
    API --> DB
    API <-->|Account Validation & Performance Data| BROKER_API
    BROKER_API --> BROKER_DB
```

---

## 3. User Registration Flows

### 3.1 New User Flow

```mermaid
flowchart TD
    A[User Clicks 'Join Competition'] --> B{First Time User?}
    B -->|Yes| C[Show New User Dialog]
    C --> D[Display Referral Code Instructions]
    D --> E[User Opens FP Markets Registration]
    E --> F[User Creates Account with Referral Code]
    F --> G[User Returns to Platform]
    G --> H[User Enters Email + Account Number]
    H --> I[Submit Application]
    I --> J[Application Stored as 'Pending']
    J --> K[Admin Reviews Application]
    K --> L{Referral Code Valid?}
    L -->|Yes| M[Admin Approves - User Welcomed]
    L -->|No| N[Admin Declines - User Notified]

    style C fill:#e1f5fe
    style M fill:#c8e6c9
    style N fill:#ffcdd2
```

### 3.2 Existing User Flow

```mermaid
flowchart TD
    A[User Clicks 'Join Competition'] --> B{First Time User?}
    B -->|No - Existing User| C[Show Existing User Dialog]
    C --> D[User Enters Email + Account Number]
    D --> E{Account Previously Verified?}
    E -->|Yes| F[Auto-Join Competition]
    E -->|No| G[Submit Application]
    G --> H[Application Stored as 'Pending']
    H --> I[Admin Reviews]
    I --> J{Valid FP Markets Account?}
    J -->|Yes| K[Admin Approves]
    J -->|No| L[Admin Declines]
    F --> M[User Added to Competition]
    K --> M

    style C fill:#fff3e0
    style M fill:#c8e6c9
    style L fill:#ffcdd2
```

### 3.3 Join Competition Dialog Flow

```mermaid
flowchart TD
    A[Click 'Join Competition' Button] --> B[Open Modal Dialog]
    B --> C{Do you have an FP Markets account?}
    C -->|No| D[New User Path]
    C -->|Yes| E[Existing User Path]

    D --> D1[Show Referral Code Banner]
    D1 --> D2[Copy Referral Code Button]
    D2 --> D3[Link to FP Markets Registration]
    D3 --> D4[Checkbox: I created account with referral code]
    D4 --> D5[Enter Email]
    D5 --> D6[Enter FP Markets Account Number]
    D6 --> D7[Submit Application]

    E --> E1[Enter Email]
    E1 --> E2[Enter FP Markets Account Number]
    E2 --> E3[Submit Application]

    D7 --> F[Show Confirmation: Pending Review]
    E3 --> F

    style D1 fill:#fff9c4
    style F fill:#e3f2fd
```

---

## 4. Admin Management Flow

### 4.1 Managing Competition Participants

```mermaid
flowchart TD
    A[Admin Dashboard] --> B[Select Competition]
    B --> C[View Participants Tab]
    C --> D[See 3 Sections]

    D --> E[Pending Applications]
    D --> F[Approved Participants]
    D --> G[Declined Applications]

    E --> H[Review Application]
    H --> I[View User Details]
    I --> J{Verify with Broker?}
    J -->|Optional| K[Call Broker API to Validate]
    K --> L{Account Valid + Referral Used?}
    J -->|Manual| L
    L -->|Yes| M[Click Approve Button]
    L -->|No| N[Click Decline Button]
    M --> O[User Notified - Welcomed]
    N --> P[User Notified - Declined]

    F --> Q[View Active Participants]
    Q --> R[Remove from Competition Option]

    style E fill:#fff3e0
    style F fill:#c8e6c9
    style G fill:#ffcdd2
```

### 4.2 Admin Dashboard - Competition Management

```mermaid
flowchart LR
    A[Admin Dashboard] --> B[Competitions List]
    B --> C[Select Competition]
    C --> D[Competition Details]

    D --> E[Edit Competition Info]
    D --> F[Manage Participants]
    D --> G[View Leaderboard]
    D --> H[Export Data]

    F --> F1[Pending: 5]
    F --> F2[Approved: 23]
    F --> F3[Declined: 2]

    G --> G1[Fetch from Broker API]
    G1 --> G2[Display Rankings]

    H --> H1[Export Participants CSV]
    H --> H2[Export Leaderboard CSV]
```

---

## 5. Leaderboard Data Flow

### 5.1 Leaderboard Generation Flow

```mermaid
sequenceDiagram
    participant Admin
    participant Platform
    participant DB
    participant FPMarkets

    Admin->>Platform: View Competition Leaderboard
    Platform->>DB: Get Competition Participants
    DB-->>Platform: List of Account Numbers
    Platform->>FPMarkets: POST /api/performance
    Note over Platform,FPMarkets: Send: account_numbers[], start_date, end_date
    FPMarkets-->>Platform: Performance Data[]
    Note over FPMarkets,Platform: Return: ROI%, PnL, trades, etc.
    Platform->>Platform: Calculate Rankings
    Platform->>DB: Cache Leaderboard Data
    Platform-->>Admin: Display Leaderboard
```

### 5.2 Public Leaderboard Display

```mermaid
sequenceDiagram
    participant User
    participant Platform
    participant Cache
    participant FPMarkets

    User->>Platform: View Competition Leaderboard
    Platform->>Cache: Check Cached Data
    alt Cache Valid (< 15 min)
        Cache-->>Platform: Return Cached Data
    else Cache Expired
        Platform->>FPMarkets: Fetch Fresh Data
        FPMarkets-->>Platform: Performance Data
        Platform->>Cache: Update Cache
    end
    Platform-->>User: Display Leaderboard
```

---

## 6. Broker API Requirements

### 6.1 Required Endpoints from FP Markets

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/account/validate` | POST | Validate account exists and referral code used | **Critical** |
| `/api/account/performance` | POST | Get trading performance for accounts | **Critical** |
| `/api/account/info` | GET | Get account metadata (creation date, status) | High |
| `/api/referral/verify` | POST | Verify specific referral code was used | High |

### 6.2 Account Validation Request

**Endpoint:** `POST /api/account/validate`

**Request:**
```json
{
  "account_number": "12345678",
  "email": "user@example.com",
  "referral_code": "AFFASAD"
}
```

**Expected Response:**
```json
{
  "valid": true,
  "account_number": "12345678",
  "email_match": true,
  "referral_code_used": true,
  "account_status": "active",
  "account_created_at": "2026-01-15T10:30:00Z",
  "account_type": "live"
}
```

### 6.3 Performance Data Request

**Endpoint:** `POST /api/account/performance`

**Request:**
```json
{
  "account_numbers": ["12345678", "87654321", "11223344"],
  "start_date": "2026-01-01T00:00:00Z",
  "end_date": "2026-01-31T23:59:59Z",
  "metrics": ["roi", "pnl", "trades_count", "win_rate", "max_drawdown"]
}
```

**Expected Response:**
```json
{
  "competition_period": {
    "start": "2026-01-01T00:00:00Z",
    "end": "2026-01-31T23:59:59Z"
  },
  "accounts": [
    {
      "account_number": "12345678",
      "display_name": "Trader***78",
      "metrics": {
        "roi_percent": 45.67,
        "pnl_usd": 4567.89,
        "starting_balance": 10000.00,
        "current_balance": 14567.89,
        "trades_count": 127,
        "winning_trades": 89,
        "losing_trades": 38,
        "win_rate_percent": 70.08,
        "max_drawdown_percent": 8.5,
        "profit_factor": 2.34
      },
      "last_trade_at": "2026-01-30T14:22:00Z",
      "status": "active"
    }
  ]
}
```

### 6.4 Data Requirements Summary

| Data Field | Description | Used For |
|------------|-------------|----------|
| `account_number` | FP Markets account ID | User identification |
| `roi_percent` | Return on Investment % | **Primary ranking metric** |
| `pnl_usd` | Profit/Loss in USD | Display |
| `starting_balance` | Balance at competition start | ROI calculation verification |
| `current_balance` | Current account balance | Display |
| `trades_count` | Number of trades | Activity verification |
| `win_rate_percent` | Winning trade percentage | Display |
| `max_drawdown_percent` | Maximum drawdown | Risk metric display |
| `last_trade_at` | Last trade timestamp | Activity check |
| `account_status` | Account status | Eligibility check |

---

## 7. Data Model Changes

### 7.1 New Collections Required

```mermaid
erDiagram
    TOURNAMENTS ||--o{ PARTICIPANTS : has
    USERS ||--o{ PARTICIPANTS : joins
    TOURNAMENTS ||--o{ LEADERBOARD_CACHE : generates

    TOURNAMENTS {
        ObjectId _id
        string title
        string tier
        string prize
        date start_date
        date end_date
        string status
        string referral_code
    }

    USERS {
        ObjectId _id
        string email
        string fp_account_number
        boolean account_verified
        date verified_at
        string referral_code_used
        date created_at
    }

    PARTICIPANTS {
        ObjectId _id
        ObjectId tournament_id
        ObjectId user_id
        string status
        date applied_at
        date approved_at
        ObjectId approved_by
        string decline_reason
    }

    LEADERBOARD_CACHE {
        ObjectId _id
        ObjectId tournament_id
        array rankings
        date fetched_at
        date expires_at
    }
```

### 7.2 Users Collection Schema

```javascript
{
  _id: ObjectId,
  email: String,                    // User email
  fp_account_number: String,        // FP Markets account number
  display_name: String,             // Optional display name
  account_verified: Boolean,        // Verified with broker
  verified_at: Date,                // When verified
  referral_code_used: String,       // Which referral code used
  is_new_user: Boolean,             // First time on platform
  created_at: Date,
  updated_at: Date
}
```

### 7.3 Participants Collection Schema

```javascript
{
  _id: ObjectId,
  tournament_id: ObjectId,          // Reference to tournament
  user_id: ObjectId,                // Reference to user
  status: String,                   // 'pending' | 'approved' | 'declined'
  applied_at: Date,
  reviewed_at: Date,
  reviewed_by: ObjectId,            // Admin who reviewed
  decline_reason: String,           // If declined
  notes: String                     // Admin notes
}
```

### 7.4 Tournament Collection Updates

```javascript
// Add to existing tournament schema:
{
  // ... existing fields ...
  start_date: Date,                 // Competition start
  end_date: Date,                   // Competition end
  status: String,                   // 'upcoming' | 'active' | 'completed'
  max_participants: Number,         // Optional cap
  referral_code: String,            // Required referral for this competition
  leaderboard_public: Boolean       // Show to non-participants
}
```

---

## 8. Security & Privacy Considerations

### 8.1 Data Handling

```mermaid
flowchart TD
    A[User Submits Account Info] --> B[Store in Platform DB]
    B --> C{Send to Broker?}
    C -->|Validation Only| D[Send account_number + email]
    C -->|Performance Query| E[Send account_numbers array]

    D --> F[Broker Returns: valid/invalid]
    E --> G[Broker Returns: anonymized performance]

    F --> H[Store verification status]
    G --> I[Display with masked account numbers]

    style D fill:#e8f5e9
    style E fill:#e8f5e9
    style I fill:#fff3e0
```

### 8.2 Privacy Requirements

| Data | Storage | Display | Shared with Broker |
|------|---------|---------|-------------------|
| Email | Encrypted | Never public | For validation only |
| Account Number | Encrypted | Masked (****1234) | Yes |
| Performance Data | Cached | Public on leaderboard | N/A (from broker) |
| Referral Code | Plain | Admin only | For validation |

---

## 9. Implementation Phases

### Phase 1: User Registration (MVP)
- [ ] Join competition dialog (new/existing user paths)
- [ ] Users collection in MongoDB
- [ ] Participants collection with status tracking
- [ ] Basic admin participant management UI

### Phase 2: Admin Management
- [ ] Competition participant tabs (pending/approved/declined)
- [ ] Approve/decline buttons with notifications
- [ ] Participant export functionality
- [ ] Admin notes and tracking

### Phase 3: Broker Integration
- [ ] Account validation API integration
- [ ] Performance data API integration
- [ ] Leaderboard caching system
- [ ] Error handling and fallbacks

### Phase 4: Public Leaderboard
- [ ] Real-time leaderboard display
- [ ] Competition status indicators
- [ ] Historical competition results
- [ ] Winner announcements

---

## 10. Questions for FP Markets

### Technical Questions

1. **API Authentication:** What authentication method will be used? (API Key, OAuth, JWT)
2. **Rate Limits:** What are the rate limits for API calls?
3. **Data Freshness:** How often is performance data updated?
4. **Webhook Support:** Can you send webhooks for account events?
5. **Sandbox Environment:** Is a test/sandbox environment available?

### Data Questions

1. **Account Anonymization:** Can you provide masked account numbers for public display?
2. **Historical Data:** How far back can we query performance data?
3. **Real-time Data:** Is real-time PnL available or is there a delay?
4. **Referral Verification:** Can you confirm referral code usage programmatically?

### Business Questions

1. **Data Agreement:** What data sharing agreement is required?
2. **SLA:** What uptime/availability guarantees are provided?
3. **Support:** Who is the technical contact for integration issues?

---

## 11. Acceptance Criteria

### For User Registration
- [ ] Users can indicate new vs existing status
- [ ] New users see referral code prominently
- [ ] Applications are stored with pending status
- [ ] Users receive confirmation of submission

### For Admin Management
- [ ] Admins can view participants by status
- [ ] Admins can approve/decline with one click
- [ ] Participant counts are visible per competition
- [ ] Actions are logged for audit

### For Broker Integration
- [ ] Account validation returns within 3 seconds
- [ ] Performance data refreshes every 15 minutes max
- [ ] Failed API calls show graceful error messages
- [ ] Cached data is served when broker unavailable

### For Leaderboard
- [ ] Rankings update automatically
- [ ] ROI% is the primary sort metric
- [ ] Account numbers are masked
- [ ] Competition period is clearly displayed

---

## Appendix A: API Error Handling

```mermaid
flowchart TD
    A[API Call to Broker] --> B{Response?}
    B -->|Success| C[Process Data]
    B -->|Timeout| D[Retry up to 3x]
    B -->|Error 4xx| E[Log Error + Show User Message]
    B -->|Error 5xx| F[Use Cached Data if Available]

    D --> G{Retry Success?}
    G -->|Yes| C
    G -->|No| F

    F --> H{Cache Available?}
    H -->|Yes| I[Show Cached + Stale Warning]
    H -->|No| J[Show Service Unavailable]

    style C fill:#c8e6c9
    style I fill:#fff3e0
    style J fill:#ffcdd2
```

---

## Appendix B: Notification Templates

### Application Submitted
> Your application to join **{competition_name}** has been received. Our team will review it within 24-48 hours. You'll receive an email once approved.

### Application Approved
> Congratulations! You've been approved to participate in **{competition_name}**. The competition runs from {start_date} to {end_date}. Good luck!

### Application Declined
> Unfortunately, your application to join **{competition_name}** was not approved. Reason: {reason}. Please contact support if you believe this is an error.
