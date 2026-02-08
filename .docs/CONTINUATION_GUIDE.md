# Continuation Guide - For Future Development

**Last Updated:** February 7, 2026
**Context:** Broker Integration Implementation Complete

---

## Quick Start for New Developers

### 1. Understanding What Was Built

This implementation adds a complete broker integration system with:
- User registration and tournament application flow
- Admin participant management dashboard
- Mock FP Markets API endpoints (ready to swap with real API)

**Key Files to Review:**
1. `.docs/IMPLEMENTATION_SUMMARY.md` - What was built
2. `.docs/TESTING_GUIDE.md` - How to test
3. `.docs/REQUIREMENTS_BROKER_INTEGRATION_v1.2.md` - Original requirements

### 2. Running the Application

```bash
# Terminal 1 - Backend
cd packages/server
npm run dev

# Terminal 2 - Frontend
cd packages/web
npm run dev

# Access:
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
# Admin: http://localhost:5173/admin
```

### 3. Database Setup

```bash
# Ensure MongoDB is running
mongosh

# Check collections
use trade-arena
db.users.find()
db.participants.find()
db.tournaments.find()
```

---

## Architecture Overview

```
User Flow:
1. User visits /competitions
2. Clicks "Join Competition"
3. Selects new/existing user
4. Fills form with email + account number
5. Accepts Terms & Conditions
6. Application submitted → Status: Pending

Admin Flow:
1. Admin logs in at /admin
2. Navigates to "Participants"
3. Reviews pending applications
4. Approves/Declines with reasons
5. Can disqualify approved participants
```

---

## Key Implementation Details

### Frontend State Management

**TournamentsPage.tsx:**
- `dialogOpen` - Controls JoinCompetitionDialog visibility
- `selectedTournament` - Stores tournament ID and title for dialog

**ParticipantManagement.tsx:**
- `selectedTournament` - Current tournament being managed
- `activeTab` - Current status tab (pending/approved/declined/disqualified)
- `participants` - Array of participants for selected tournament

### Backend API Flow

**User Application:**
```
POST /api/participants/apply
→ Creates/finds user
→ Creates participant with status "pending"
→ Returns success
```

**Admin Actions:**
```
PUT /api/participants/:id/approve
→ Updates status to "approved"
→ Records reviewed_by and reviewed_at

PUT /api/participants/:id/decline
→ Updates status to "declined"
→ Stores decline_reason

PUT /api/participants/:id/disqualify
→ Updates status to "disqualified"
→ Stores disqualification_reason
```

---

## Common Development Tasks

### Adding a New Field to User Model

1. Update `packages/server/src/models/User.ts`
2. Update TypeScript interface
3. Update schema definition
4. Update API endpoints that use User model
5. Update frontend components that display user data

### Adding a New Participant Status

1. Update `Participant.ts` interface: `status` type
2. Update `ParticipantManagement.tsx`: Add new tab
3. Update API endpoints to handle new status
4. Add new action buttons/logic

### Replacing Mock Broker API

**Location:** `packages/server/src/index.ts` (lines ~450-550)

**Steps:**
1. Add FP Markets credentials to `.env`
2. Install FP Markets SDK (if available)
3. Replace mock endpoints with real API calls
4. Update request/response handling
5. Add error handling for API failures
6. Test with real broker accounts

**Example:**
```typescript
// Before (Mock)
app.post("/api/broker/validate", async (req, res) => {
  res.json({ valid: true, /* mock data */ });
});

// After (Real)
app.post("/api/broker/validate", async (req, res) => {
  const { account_number, email, referral_code } = req.body;

  try {
    const response = await fpMarketsClient.validateAccount({
      accountNumber: account_number,
      email,
      referralCode: referral_code
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Troubleshooting

### Issue: "Cannot find module" errors

**Solution:**
```bash
cd packages/server && npm install
cd packages/web && npm install
```

### Issue: MongoDB connection failed

**Solution:**
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start MongoDB
brew services start mongodb-community

# Or use Docker
docker run -d -p 27017:27017 mongo
```

### Issue: Port already in use

**Solution:**
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in .env
BACKEND_PORT=3002
```

### Issue: TypeScript compilation errors

**Solution:**
```bash
# Clean build
cd packages/web
rm -rf node_modules dist
npm install
npm run build
```

---

## Testing Strategy

### Unit Tests (To Be Added)

**Backend:**
- Test User model validation
- Test Participant status transitions
- Test API endpoint responses

**Frontend:**
- Test JoinCompetitionDialog form validation
- Test ParticipantManagement tab switching
- Test API integration

### Integration Tests (To Be Added)

- Test complete user registration flow
- Test admin approval workflow
- Test mock broker API responses

### E2E Tests (To Be Added)

- Test full user journey from registration to approval
- Test admin dashboard functionality
- Test responsive design on different devices

---

## Performance Considerations

### Current Performance

- Frontend bundle: 548.16 kB (gzipped: 154.85 kB)
- API response time: < 500ms (mock endpoints)
- Page load time: < 2 seconds

### Optimization Opportunities

1. **Code Splitting**
   - Lazy load ParticipantManagement component
   - Split admin routes into separate bundle

2. **API Caching**
   - Cache participant lists for 30 seconds
   - Implement Redis for leaderboard cache

3. **Database Indexing**
   - Add indexes on frequently queried fields
   - Optimize participant status queries

---

## Security Considerations

### Current Implementation

- JWT authentication for admin routes
- Password hashing with bcrypt
- Input validation on all endpoints
- CORS enabled for frontend

### Security Enhancements Needed

1. **Rate Limiting**
   - Add rate limiting to API endpoints
   - Prevent brute force attacks on login

2. **Input Sanitization**
   - Add XSS protection
   - Validate all user inputs

3. **HTTPS**
   - Enable HTTPS in production
   - Use secure cookies for JWT

4. **Audit Logging**
   - Log all admin actions
   - Track participant status changes

---

## Deployment Checklist

### Pre-Deployment

- [ ] Run all tests
- [ ] Check for TypeScript errors
- [ ] Review security vulnerabilities
- [ ] Update environment variables
- [ ] Test with real broker API
- [ ] Perform load testing

### Deployment Steps

1. **Build Production Bundle**
   ```bash
   cd packages/web
   npm run build
   ```

2. **Set Environment Variables**
   ```bash
   # Production .env
   NODE_ENV=production
   MONGODB_URI=<production-mongodb-uri>
   JWT_SECRET=<strong-secret>
   FP_MARKETS_API_KEY=<real-api-key>
   ```

3. **Deploy Backend**
   - Deploy to your hosting service
   - Ensure MongoDB is accessible
   - Configure CORS for production domain

4. **Deploy Frontend**
   - Upload dist folder to CDN/hosting
   - Update API_URL to production backend
   - Configure DNS

### Post-Deployment

- [ ] Verify all endpoints work
- [ ] Test user registration flow
- [ ] Test admin dashboard
- [ ] Monitor error logs
- [ ] Set up monitoring/alerts

---

## Future Enhancements

### Phase 1 (Immediate)
- Add email notifications for status changes
- Add participant export to CSV
- Add search/filter in participant list

### Phase 2 (Short-term)
- Implement leaderboard with real-time updates
- Add participant performance charts
- Add bulk approve/decline actions

### Phase 3 (Long-term)
- Add user dashboard for tracking applications
- Add tournament analytics for admins
- Add automated participant verification

---

## Resources

### Documentation
- Requirements: `.docs/REQUIREMENTS_BROKER_INTEGRATION_v1.2.md`
- Implementation: `.docs/IMPLEMENTATION_SUMMARY.md`
- Testing: `.docs/TESTING_GUIDE.md`

### External Resources
- FP Markets API Docs: (Add when available)
- MongoDB Docs: https://docs.mongodb.com
- React Docs: https://react.dev
- Express Docs: https://expressjs.com

---

## Contact & Support

For questions or issues:
1. Check this guide first
2. Review implementation summary
3. Check testing guide
4. Contact development team

---

## Version History

- **v1.0** (2026-02-07): Initial broker integration implementation
  - User registration flow
  - Admin participant management
  - Mock broker API endpoints
