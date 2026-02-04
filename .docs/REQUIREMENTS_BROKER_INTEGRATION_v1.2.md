# LiveTradingLeague - Broker Integration & User Flow Requirements

## Document Info
- **Version:** 1.2
- **Date:** February 2026
- **Status:** Draft for Stakeholder Review
- **Broker Partner:** FP Markets

---

## 1. Executive Summary

This document outlines the technical requirements for integrating FP Markets broker data to power the LiveTradingLeague competition platform. It covers user registration flows, tournament participation, leaderboard data requirements, and admin management capabilities, including the ability to disqualify participants during a live competition.

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
    H --> I[Check Terms & Conditions]
    I --> J[Submit Application]
    J --> K[Application Stored as 'Pending']
    K --> L[Admin Reviews Application]
    L --> M{Referral Code Valid?}
    M -->|Yes| N[Admin Approves - User Welcomed]
    M -->|No| O[Admin Declines - User Notified]

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
    E -->|Yes| F0[Check Terms & Conditions]
    F0 --> F[Auto-Join Competition]
    E -->|No| G0[Check Terms & Conditions]
    G0 --> G[Submit Application]
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
    D6 --> D6a[Checkbox: I accept Terms & Conditions]
    D6a --> D7[Submit Application]

    E --> E1[Enter Email]
    E1 --> E2[Enter FP Markets Account Number]
    E2 --> E2a[Checkbox: I accept Terms & Conditions]
    E2a --> E3[Submit Application]

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
    C --> D[See 4 Sections]

    D --> E[Pending Applications]
    D --> F[Approved Participants]
    D --> G[Declined Applications]
    D --> H[Disqualified Participants]

    E --> I[Review Application]
    I --> J[View User Details]
    J --> K{Verify with Broker?}
    K -->|Optional| L[Call Broker API to Validate]
    L --> M{Account Valid + Referral Used?}
    K -->|Manual| M
    M -->|Yes| N[Click Approve Button]
    M -->|No| O[Click Decline Button]
    N --> P[User Notified - Welcomed]
    O --> Q[User Notified - Declined]

    F --> R[View Active Participants]
    R --> S[Disqualify Participant Option]
    S --> T[Confirm Disqualification]
    T --> U[User Marked as Disqualified]
    U --> V[Remove from Leaderboard]
    U --> W[User Notified of Disqualification]

    style E fill:#fff3e0
    style F fill:#c8e6c9
    style G fill:#ffcdd2
    style H fill:#fce4ec
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

    F --> F1[Pending Applications]
    F --> F2[Approved Participants]
    F --> F3[Declined/Disqualified]

    G --> G1[Fetch from Broker API]
    G1 --> G2[Display Rankings]
    G2 --> G3[Exclude Disqualified Users]

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
    Platform->>DB: Get Competition Participants (Status: Approved)
    DB-->>Platform: List of Account Numbers
    Platform->>FPMarkets: POST /api/performance
    Note over Platform,FPMarkets: Send: account_numbers[], start_date, end_date
    FPMarkets-->>Platform: Performance Data[]
    Note over FPMarkets,Platform: Return: balances, trades, etc.
    Platform->>Platform: Calculate Rankings (Filter out Disqualified)
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
    Platform-->>User: Display Leaderboard (Excluding Disqualified)
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
  "metrics": ["trades_count", "balance"]
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
        "starting_balance": 10000.00,
        "current_balance": 14567.89,
        "trades_count": 127
      },
      "last_trade_at": "2026-01-30T14:22:00Z",
      "status": "active"
    }
  ]
}
```

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
        date disqualified_at
        ObjectId disqualified_by
        string decline_reason
        string disqualification_reason
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
  status: String,                   // 'pending' | 'approved' | 'declined' | 'disqualified'
  applied_at: Date,
  reviewed_at: Date,
  reviewed_by: ObjectId,            // Admin who reviewed
  decline_reason: String,           // If declined
  disqualified_at: Date,            // When disqualified
  disqualified_by: ObjectId,        // Admin who disqualified
  disqualification_reason: String,  // Reason for disqualification
  notes: String                     // Admin notes
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

---

## 9. Implementation Phases

### Phase 1: User Registration (MVP)
- [x] Join competition dialog (new/existing user paths)
- [x] Users collection in MongoDB
- [x] Participants collection with status tracking
- [x] Basic admin participant management UI
- [ ] **Terms and Conditions agreement checkbox**

### Phase 2: Admin Management
- [ ] Competition participant tabs (pending/approved/declined/disqualified)
- [ ] Approve/decline buttons with notifications
- [ ] **Disqualification system (mark as disqualified, remove from leaderboard)**
- [ ] Participant export functionality
- [ ] Admin notes and tracking

### Phase 3: Broker Integration
- [ ] Account validation API integration
- [ ] Performance data API integration
- [ ] Leaderboard caching system
- [ ] Error handling and fallbacks

---

## 10. Acceptance Criteria

### For User Registration
- [ ] Users can indicate new vs existing status
- [ ] New users see referral code prominently
- [ ] Applications are stored with pending status
- [ ] Users receive confirmation of submission
- [ ] **User cannot submit application without checking "I have read Terms and Conditions"**

### For Admin Management
- [ ] Admins can view participants by status (including Disqualified)
- [ ] Admins can approve/decline with one click
- [ ] **Admins can disqualify any active participant at any time**
- [ ] **Disqualified participants are immediately removed from the leaderboard**
- [ ] **Disqualification on platform does NOT affect the user's account at FP Markets**
- [ ] Actions are logged for audit

---

## Appendix B: Notification Templates

### Application Approved
> Congratulations! You've been approved to participate in **{competition_name}**. The competition runs from {start_date} to {end_date}. Good luck!

### Application Declined
> Unfortunately, your application to join **{competition_name}** was not approved. Reason: {reason}. Please contact support if you believe this is an error.

### Participant Disqualified
> We regret to inform you that you have been disqualified from **{competition_name}**. Reason: {reason}. This decision only affects your participation in this competition and does not impact your FP Markets trading account.
