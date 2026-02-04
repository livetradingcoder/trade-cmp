# LiveTradingLeague - FP Markets Integration Requirements

## Document Info
- **Version:** 1.2
- **Date:** February 2026
- **Status:** Draft for Partner Review
- **From:** LiveTradingLeague Team
- **To:** FP Markets Technical Team

---

## 1. Executive Summary

This document outlines the API requirements LiveTradingLeague needs from FP Markets to power our trading competition platform. We require endpoints for account validation and performance data retrieval to manage competition participants and generate leaderboards. Version 1.2 includes considerations for participant disqualification management.

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

## 3. User Registration & Lifecycle Flow

```mermaid
flowchart TD
    A[User Clicks 'Join Competition'] --> B{Has FP Markets Account?}

    B -->|No - New User| C[Show Referral Code]
    C --> D[User Registers at FP Markets with Referral]
    D --> E[User Returns to Platform]
    E --> F[Enter Email + Account Number]

    B -->|Yes - Existing User| G[Enter Email + Account Number]

    F --> F1[Check Terms & Conditions]
    G --> G1[Check Terms & Conditions]

    F1 --> H[Submit Application]
    G1 --> H

    H --> I[Application Stored as 'Pending']
    I --> J[Admin Reviews]
    J --> K{Account Valid?}

    K -->|No| M[Declined - User Notified]
    K -->|Yes| L[Approved - Participation Active]

    L --> N{During Competition}
    N -->|Breaking Rules| O[Disqualified by Admin]
    O --> P[Removed from Leaderboard]
    O --> Q[Participation Terminated]
    P --> R[Note: Broker Account Remains Unchanged]

    style C fill:#fff9c4
    style L fill:#c8e6c9
    style M fill:#ffcdd2
    style O fill:#fce4ec
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
        Platform->>Platform: Calculate Rankings (excluding Disqualified)
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

### 6.2 Platform Compliance & Broker Integrity

- **Disqualification Independence:** A disqualification on the LiveTradingLeague platform for rule-breaking (e.g., unauthorized trading strategies, late entry, etc.) is strictly a platform-level action. It **does not** require any status change on the FP Markets side.
- **Data Refresh:** Performance data is queried periodically to ensure leaderboard accuracy.

---

## 7. Questions for FP Markets

### Technical Questions

1. **API Authentication:** What authentication method will be used? (API Key, OAuth, JWT)
2. **Rate Limits:** What are the rate limits for API calls?
3. **Data Freshness:** How often is performance data updated?
4. **Webhook Support:** Can you send webhooks for account events?
5. **Sandbox Environment:** Is a test/sandbox environment available?

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
