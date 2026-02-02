# LiveTradingLeague - FP Markets Integration Requirements

## Document Info
- **Version:** 1.1
- **Date:** February 2026
- **Status:** Draft for Partner Review
- **From:** LiveTradingLeague Team
- **To:** FP Markets Technical Team

---

## 1. Executive Summary

This document outlines the API requirements LiveTradingLeague needs from FP Markets to power our trading competition platform. We require endpoints for account validation and performance data retrieval to manage competition participants and generate leaderboards.

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

## 3. User Registration Flow

```mermaid
flowchart TD
    A[User Clicks 'Join Competition'] --> B{Has FP Markets Account?}

    B -->|No - New User| C[Show Referral Code]
    C --> D[User Registers at FP Markets with Referral]
    D --> E[User Returns to Platform]
    E --> F[Enter Email + Account Number]

    B -->|Yes - Existing User| G[Enter Email + Account Number]

    F --> H[Submit Application]
    G --> H

    H --> I[Application Stored as 'Pending']
    I --> J[Admin Reviews]
    J --> K{Account Valid?}

    K -->|Yes| L[Approved - User Joins Competition]
    K -->|No| M[Declined - User Notified]

    style C fill:#fff9c4
    style L fill:#c8e6c9
    style M fill:#ffcdd2
```

---

## 4. Leaderboard Data Flow

```mermaid
sequenceDiagram
    participant User/Admin
    participant Platform
    participant Cache
    participant FPMarkets

    User/Admin->>Platform: View Competition Leaderboard
    Platform->>Cache: Check Cached Data

    alt Cache Valid (< 15 min)
        Cache-->>Platform: Return Cached Data
    else Cache Expired or Admin Request
        Platform->>FPMarkets: POST /api/account/performance
        Note over Platform,FPMarkets: Send: account_numbers[], start_date, end_date
        FPMarkets-->>Platform: Performance Data[]
        Note over FPMarkets,Platform: Return: balances, trades, etc.
        Platform->>Platform: Calculate Rankings
        Platform->>Cache: Update Cache
    end

    Platform-->>User/Admin: Display Leaderboard
```

---

## 5. Required API Endpoints

### 5.1 Endpoint Summary

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/account/validate` | POST | Validate account exists and referral code used | **Critical** |
| `/api/account/performance` | POST | Get trading performance for accounts | **Critical** |
| `/api/account/info` | GET | Get account metadata (creation date, status) | High |
| `/api/referral/verify` | POST | Verify specific referral code was used | High |

### 5.2 Account Validation Request

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

### 5.3 Performance Data Request

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

### 5.4 Data Requirements Summary

| Data Field | Description | Used For |
|------------|-------------|----------|
| `account_number` | FP Markets account ID | User identification |
| `starting_balance` | Balance at competition start | Ranking calculation |
| `current_balance` | Current account balance | Ranking calculation & Display |
| `trades_count` | Number of trades | Activity verification |
| `last_trade_at` | Last trade timestamp | Activity check |
| `account_status` | Account status | Eligibility check |

---

## 6. Security & Privacy Considerations

### 6.1 Data Flow

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

### 6.2 Privacy Requirements

| Data | Storage | Display | Shared with Broker |
|------|---------|---------|-------------------|
| Email | Encrypted | Never public | For validation only |
| Account Number | Encrypted | Masked (****1234) | Yes |
| Performance Data | Cached | Public on leaderboard | N/A (from broker) |
| Referral Code | Plain | Admin only | For validation |

---

## 7. Questions for FP Markets

### Technical Questions

1. **API Authentication:** What authentication method will be used? (API Key, OAuth, JWT)
2. **Rate Limits:** What are the rate limits for API calls?
3. **Data Freshness:** How often is performance data updated?
4. **Webhook Support:** Can you send webhooks for account events?
5. **Sandbox Environment:** Is a test/sandbox environment available?

### Data Questions

1. **Account Anonymization:** Can you provide masked account numbers for public display?
2. **Historical Data:** How far back can we query performance data?
3. **Real-time Data:** Is real-time balance data available or is there a delay?
4. **Referral Verification:** Can you confirm referral code usage programmatically?

---

## Appendix A: API Error Handling

**Request:** Please provide documentation on your API error response format and error codes so we can implement proper error handling on our frontend.

We anticipate needing to handle the following scenarios:

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

### Information Needed from FP Markets

- List of possible error codes and their meanings
- Recommended retry strategies
- Rate limit error responses
- Authentication error responses
- Suggested user-facing error messages for common scenarios
