# Testing Guide - Broker Integration

**Last Updated:** February 7, 2026
**Status:** Ready for Manual Testing

---

## Prerequisites

**Servers Running:**
- Backend: http://localhost:3001
- Frontend: http://localhost:5173
- MongoDB: Connected

**Admin Credentials:**
Check your database for existing admin account or create one.

---

## Test Flow 1: New User Registration & Application

**Objective:** Test the complete flow for a new user joining a competition

### Steps:

1. **Navigate to Competitions Page**
   - Open http://localhost:5173/competitions
   - Verify tournaments are displayed
   - Verify affiliate code banner is shown (if configured)

2. **Click "Join Competition" Button**
   - Click on any tournament's "Join Competition" button
   - Verify dialog opens with smooth animation

3. **Select "No, I'm new"**
   - Click the "No, I'm new" option
   - Verify referral code section appears
   - Verify referral code is displayed (should be "AFFASAD" or from settings)

4. **Copy Referral Code**
   - Click "Copy" button
   - Verify "Copied!" feedback appears
   - Verify code is in clipboard

5. **Open Broker Registration** (Optional)
   - Click "Open FP Markets Registration" button
   - Verify new tab opens to FP Markets website

6. **Fill Application Form**
   - Check "I created my account with the referral code above"
   - Enter email: `test@example.com`
   - Enter account number: `12345678`
   - Check "I have read and accept the Terms & Conditions"

7. **Submit Application**
   - Click "Submit Application"
   - Verify success message appears
   - Verify dialog closes after 3 seconds

**Expected Results:**
- ✅ Application submitted successfully
- ✅ Status: "Pending admin review"
- ✅ User created in database
- ✅ Participant record created with status "pending"

**Database Verification:**
```javascript
// Check in MongoDB
db.users.findOne({ email: "test@example.com" })
db.participants.findOne({ user_id: <user_id> })
```

---

## Test Flow 2: Existing User Registration

**Objective:** Test flow for users who already have FP Markets account

### Steps:

1. **Navigate to Competitions Page**
   - Open http://localhost:5173/competitions

2. **Click "Join Competition" Button**
   - Click on any tournament's "Join Competition" button

3. **Select "Yes, I have an account"**
   - Click the "Yes, I have an account" option
   - Verify form appears without referral code section

4. **Fill Application Form**
   - Enter email: `existing@example.com`
   - Enter account number: `87654321`
   - Check "I have read and accept the Terms & Conditions"

5. **Submit Application**
   - Click "Submit Application"
   - Verify success message appears

**Expected Results:**
- ✅ Application submitted successfully
- ✅ No referral code requirement
- ✅ User marked as `is_new_user: false`

---

## Test Flow 3: Admin Participant Management

**Objective:** Test admin approval/decline/disqualify workflows

### Steps:

1. **Login to Admin Dashboard**
   - Navigate to http://localhost:5173/admin
   - Enter admin credentials
   - Click "Login"
   - Verify redirect to dashboard

2. **Navigate to Participants Section**
   - Click "Participants" in sidebar
   - Verify participant management UI loads
   - Verify tournament selector is visible

3. **View Pending Applications**
   - Verify "Pending" tab is active by default
   - Verify pending applications are displayed
   - Verify participant details are shown:
     - Email
     - Account number (last 4 digits masked)
     - Application date

4. **Approve a Participant**
   - Click "Approve" button on a pending application
   - Verify loading state
   - Verify participant moves to "Approved" tab
   - Verify success feedback

5. **Decline a Participant**
   - Click "Decline" button on another pending application
   - Verify reason dialog appears
   - Enter reason: "Account does not meet minimum balance requirement"
   - Click "Decline" in dialog
   - Verify participant moves to "Declined" tab
   - Verify reason is displayed

6. **View Approved Participants**
   - Click "Approved" tab
   - Verify approved participants are listed
   - Verify "Disqualify" button is available

7. **Disqualify a Participant**
   - Click "Disqualify" button on an approved participant
   - Verify reason dialog appears
   - Enter reason: "Violated competition rules"
   - Click "Disqualify" in dialog
   - Verify participant moves to "Disqualified" tab
   - Verify reason is displayed

**Expected Results:**
- ✅ All status transitions work correctly
- ✅ Reasons are stored and displayed
- ✅ Tab counts update in real-time
- ✅ Admin actions are logged (reviewed_by, timestamps)

---

## Test Flow 4: Form Validation

**Objective:** Test form validation and error handling

### Steps:

1. **Test Empty Form Submission**
   - Open join competition dialog
   - Select user type
   - Click "Submit Application" without filling fields
   - Verify error message: "Please fill in all required fields"

2. **Test Missing Terms Acceptance**
   - Fill email and account number
   - Leave Terms & Conditions unchecked
   - Click "Submit Application"
   - Verify error message: "You must accept the Terms & Conditions to continue"

3. **Test New User Without Referral Confirmation**
   - Select "No, I'm new"
   - Fill all fields
   - Leave "I created account with referral code" unchecked
   - Click "Submit Application"
   - Verify error message about referral code confirmation

4. **Test Invalid Email Format**
   - Enter invalid email: "notanemail"
   - Try to submit
   - Verify browser validation or error message

**Expected Results:**
- ✅ All validation rules enforced
- ✅ Clear error messages displayed
- ✅ Form cannot be submitted with invalid data

---

## Test Flow 5: Duplicate Application Prevention

**Objective:** Test that users cannot apply twice to same tournament

### Steps:

1. **Submit First Application**
   - Join a competition as a new user
   - Complete application successfully

2. **Try to Apply Again**
   - Click "Join Competition" on the same tournament
   - Fill form with same email/account number
   - Submit application

**Expected Results:**
- ✅ Error message: "You have already applied to this tournament"
- ✅ Shows existing application status
- ✅ No duplicate participant record created

---

## Test Flow 6: Mock Broker API Responses

**Objective:** Verify mock broker endpoints return correct data

### Steps:

1. **Test Account Validation**
   ```bash
   curl -X POST http://localhost:3001/api/broker/validate \
     -H "Content-Type: application/json" \
     -d '{
       "account_number": "12345678",
       "email": "test@example.com",
       "referral_code": "AFFASAD"
     }'
   ```

   **Expected Response:**
   ```json
   {
     "valid": true,
     "account_number": "12345678",
     "email_match": true,
     "referral_code_used": true,
     "account_status": "active",
     "account_type": "live",
     "account_balance": 15000.00,
     "user_info": {
       "first_name": "John",
       "last_name_masked": "D***"
     }
   }
   ```

2. **Test Account Info**
   ```bash
   curl http://localhost:3001/api/broker/info?account_number=12345678
   ```

3. **Test Performance Data**
   ```bash
   curl -X POST http://localhost:3001/api/broker/performance \
     -H "Content-Type: application/json" \
     -d '{
       "account_numbers": ["12345678", "87654321"],
       "start_date": "2026-01-01T00:00:00Z",
       "end_date": "2026-02-07T00:00:00Z"
     }'
   ```

**Expected Results:**
- ✅ All endpoints return 200 OK
- ✅ Response format matches FP Markets specification
- ✅ Mock data is realistic and consistent

---

## Test Flow 7: Responsive Design

**Objective:** Test UI on different screen sizes

### Steps:

1. **Desktop View (1920x1080)**
   - Verify all elements are properly spaced
   - Verify dialog is centered
   - Verify admin dashboard layout is optimal

2. **Tablet View (768x1024)**
   - Verify responsive breakpoints work
   - Verify navigation adapts
   - Verify forms remain usable

3. **Mobile View (375x667)**
   - Verify dialog is full-width on mobile
   - Verify buttons stack vertically
   - Verify text is readable
   - Verify touch targets are adequate

**Expected Results:**
- ✅ UI adapts smoothly to all screen sizes
- ✅ No horizontal scrolling
- ✅ All functionality remains accessible

---

## Test Flow 8: Admin Authentication

**Objective:** Test admin login and protected routes

### Steps:

1. **Access Admin Without Login**
   - Navigate to http://localhost:5173/admin
   - Verify login page is shown

2. **Login with Invalid Credentials**
   - Enter wrong username/password
   - Click "Login"
   - Verify error message

3. **Login with Valid Credentials**
   - Enter correct credentials
   - Click "Login"
   - Verify redirect to dashboard
   - Verify token is stored

4. **Access Protected Endpoints**
   - Try to access `/api/participants/:id` without token
   - Verify 401 Unauthorized response

5. **Logout**
   - Click "Logout" button
   - Verify redirect to login
   - Verify token is cleared

**Expected Results:**
- ✅ Protected routes require authentication
- ✅ JWT token is properly managed
- ✅ Logout clears session

---

## Common Issues & Solutions

### Issue: Dialog doesn't open
**Solution:** Check browser console for errors. Verify tournament ID is valid.

### Issue: API returns 500 error
**Solution:** Check server logs. Verify MongoDB is running.

### Issue: Participant list is empty
**Solution:** Verify tournament has participants. Check API response in Network tab.

### Issue: Styles not loading
**Solution:** Verify CSS files are imported. Check browser console for 404 errors.

---

## Performance Benchmarks

**Expected Performance:**
- Page load: < 2 seconds
- Dialog open animation: < 300ms
- API response time: < 500ms
- Form submission: < 1 second

---

## Browser Compatibility

**Tested Browsers:**
- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

**Known Issues:**
- None at this time

---

## Next Steps After Testing

1. **Document any bugs found**
2. **Create GitHub issues for bugs**
3. **Test with real FP Markets API (when available)**
4. **Perform load testing**
5. **Security audit**
6. **Deploy to staging**

---

## Contact

For questions or issues during testing:
- Check server logs: `/tmp/server.log`
- Check frontend logs: `/tmp/web.log`
- Review implementation: `.docs/IMPLEMENTATION_SUMMARY.md`
