# Admin Portal User Guide

## Quick Start

### Access Admin Portal

1. Open the application in your browser (http://localhost:5173 for development)
2. Click the **"Verify Manager"** button
3. Enter credentials:
   - **Username**: `admin`
   - **Password**: `admin`
4. Click **Login**

## Managing Competitions

### View All Competitions

After logging in, you'll see all tournaments displayed in cards with:
- Tournament title
- Tier (Weekly/Monthly)
- Prize information
- Entry fee
- Number of participants
- Time label and countdown
- Registration link

### Create New Competition

1. Click the **"Create New Competition"** button (green button with + icon)
2. Fill in the tournament details:

   **Required Fields:**
   - **Title**: Name of the tournament
   - **Registration Link**: URL where users can register

   **Optional Fields (with defaults):**
   - **Tier**: Weekly or Monthly (default: Weekly)
   - **Prize**: Prize description (default: empty)
   - **Fee**: Entry fee (default: empty)
   - **Time Label**: "Starts in" or "Ends in" (default: Starts in)
   - **Time Left**: Countdown timer (default: empty)
   - **Cover Image URL**: Tournament cover image (default: preset image)
   - **Additional Image URL**: Extra image for the card (default: empty)

3. Click **"Create Competition"**
4. The new tournament will appear immediately in the list

### Edit Existing Competition

1. Find the tournament card you want to edit
2. Click the **Edit** button (pencil icon)
3. Modify any fields you want to change
4. Click **"Save"** (green checkmark button)
5. Or click **"Cancel"** (red X button) to discard changes
6. Changes are saved immediately to the database

### Delete Competition

1. Find the tournament card you want to delete
2. Click the **Delete** button (trash icon)
3. Confirm the deletion in the dialog
4. The tournament is removed from the database immediately

### Logout

Click the **Logout** button (top-right) to exit admin mode

## Field Explanations

### Tournament Fields

| Field | Description | Example |
|-------|-------------|---------|
| **Title** | Tournament name | "January Clash" |
| **Tier** | Tournament frequency | "Weekly" or "Monthly" |
| **Prize** | Prize description | "50K Challenge" |
| **Fee** | Entry fee | "$10" |
| **Participants** | Number of participants | 1481 |
| **Time Label** | Status label | "Starts in" or "Ends in" |
| **Time Left** | Countdown | "27d 20:17:59" |
| **Cover** | Cover image URL | https://... |
| **Image** | Additional image URL | https://... |
| **Registration Link** | Sign-up URL | https://tradingview.com |

## Tips & Best Practices

### Creating Tournaments

1. **Always provide a title and registration link** - these are required
2. **Use clear prize descriptions** - e.g., "50K Challenge" or "$10,000 Prize"
3. **Set appropriate tiers** - Weekly for short tournaments, Monthly for longer ones
4. **Use consistent time formats** - e.g., "7d 12:30:00" for 7 days, 12 hours, 30 minutes
5. **Provide cover images** - Use high-quality images for better appearance

### Time Labels

- Use **"Starts in"** for upcoming tournaments
- Use **"Ends in"** for active tournaments
- The UI will display these labels with the countdown

### Image URLs

- Use **HTTPS URLs only** for security
- Recommended: Use Firebase Storage or similar CDN
- Test image URLs before saving
- Optimal size: 1200x600px for cover images

### Editing Tips

1. **Edit in-place** - Click edit button and change fields directly
2. **Save frequently** - Changes are instant but save regularly
3. **Preview before saving** - The card updates as you type
4. **Cancel if needed** - Discard changes by clicking cancel

## Database Integration

### How It Works

1. **Admin creates/edits tournament** → Saved to MongoDB
2. **MongoDB stores tournament** → Returns confirmation
3. **UI refreshes automatically** → Shows updated data
4. **Users see new data** → No page refresh needed

### Data Flow

```
Admin Portal → POST/PUT/DELETE Request 
    ↓
Express API Server
    ↓
MongoDB Database (trade_arena)
    ↓
GET Request Returns Data
    ↓
UI Updates Automatically
```

## Troubleshooting

### Cannot Login

- Check username is `admin` (lowercase)
- Check password is `admin`
- Verify backend server is running (port 3001)
- Check MongoDB connection

### Changes Not Appearing

- Check browser console for errors
- Verify backend is running
- Check MongoDB connection
- Refresh the page

### Cannot Create Tournament

- Ensure **Title** is not empty
- Ensure **Registration Link** is not empty
- Check that fields have valid data
- Check backend logs for validation errors

### Images Not Loading

- Verify image URLs are valid and accessible
- Use HTTPS URLs
- Check CORS settings if using external images
- Test URL in browser first

## API Endpoints Used

The admin portal uses these API endpoints:

- `POST /api/admin/login` - Authentication
- `GET /api/tournaments` - Fetch all tournaments
- `POST /api/tournaments` - Create tournament
- `PUT /api/tournaments/:id` - Update tournament
- `DELETE /api/tournaments/:id` - Delete tournament

## Security Notes

⚠️ **Current Implementation**

- Basic authentication (username/password)
- Session storage for admin state
- No password encryption
- No rate limiting

⚠️ **For Production Use**

You should implement:
1. Password hashing (bcrypt)
2. JWT authentication
3. HTTPS only
4. Rate limiting
5. CSRF protection
6. Role-based access control

## Support

For issues:
1. Check TESTING_RESULTS.md for verification tests
2. Check MONGODB_MIGRATION.md for database setup
3. Check backend logs in terminal
4. Check browser console for errors

## Quick Commands

### Development

```bash
# Start backend
cd packages/server && npm run dev

# Start frontend
cd packages/web && npm run dev

# Seed database
cd packages/server && npm run db:seed
```

### Verify Backend

```bash
# Check health
curl http://localhost:3001/api/health

# Check tournaments
curl http://localhost:3001/api/tournaments

# Test login
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

## Happy Managing! 🎉

The admin portal is fully functional and ready to manage your trading competitions!
