# LiveTradingLeague - Server Documentation

## Entry Point
`packages/server/src/index.ts`

## Directory Structure

```
packages/server/src/
├── index.ts              # Express server setup & routes
├── config/
│   ├── database.ts       # MongoDB connection, auto-seeding
│   └── cloudinary.ts     # Image upload configuration
├── middleware/
│   ├── auth.ts           # JWT generation & verification
│   └── upload.ts         # Multer file upload config
├── models/
│   ├── Tournament.ts     # Tournament data model
│   ├── Admin.ts          # Admin user model
│   └── Settings.ts       # Key-value settings model
├── utils/
│   └── email.ts          # Password reset emails
└── seed.ts               # Database initialization
```

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/admin/login` | Admin login | No |
| POST | `/api/admin/forgot-password` | Request reset | No |
| POST | `/api/admin/reset-password/:token` | Reset password | No |
| GET | `/api/admin/verify` | Verify token | Yes |
| POST | `/api/admin/change-password` | Change password | Yes |

### Tournaments
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/tournaments` | List all | No |
| GET | `/api/tournaments/:id` | Get one | No |
| POST | `/api/tournaments` | Create | Yes |
| PUT | `/api/tournaments/:id` | Update | Yes |
| DELETE | `/api/tournaments/:id` | Delete | Yes |

### Settings
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/settings` | Get all | No |
| GET | `/api/settings/:key` | Get by key | No |
| PUT | `/api/settings/:key` | Update | Yes |

### Upload
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/upload` | Upload image | Yes |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server status |

## Data Models

### Tournament
```typescript
{
  _id: ObjectId,
  title: string,
  tier: string,           // "Weekly" | "Monthly" | "Bi-Weekly"
  prize: string,          // e.g., "50K Challenge"
  fee: string,            // e.g., "$10"
  participants: number,
  timeLabel: string,      // "Seats Left" | "Ends in" | "Starts in"
  timeLeft: string,       // e.g., "27d 20:17:59"
  cover: string,          // Tournament image URL
  image?: string,         // Additional image
  registrationLink: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Admin
```typescript
{
  _id: ObjectId,
  username: string,       // unique
  email: string,          // unique
  password: string,       // bcrypt hashed
  resetPasswordToken?: string,
  resetPasswordExpires?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Settings
```typescript
{
  key: string,            // unique, e.g., "affiliateCode"
  value: string,
  updatedAt: Date
}
```

## Environment Variables

### Required
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` or `DATABASE_URL` | MongoDB connection string |
| `JWT_SECRET` | JWT signing key |

### Cloudinary (for image uploads)
| Variable | Description |
|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Cloud name |
| `CLOUDINARY_API_KEY` | API key |
| `CLOUDINARY_API_SECRET` | API secret |

### Email (for password reset)
| Variable | Description |
|----------|-------------|
| `EMAIL_HOST` | SMTP host |
| `EMAIL_PORT` | SMTP port |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASS` | SMTP password |
| `FRONTEND_URL` | Frontend URL for reset links |

### Defaults
| Variable | Default |
|----------|---------|
| `ADMIN_USERNAME` | "ltl-admin-1" |
| `ADMIN_PASSWORD` | "Adm!n2026" |
| `JWT_SECRET` | "your-secret-key-change-in-production" |

## Security Features

- **Password Hashing:** bcrypt with 10-salt rounds
- **Reset Tokens:** SHA256 hashed, 1-hour expiration
- **JWT:** 7-day token validity
- **File Upload:** Whitelist (jpeg, jpg, png, gif, webp), 5MB limit
- **CORS:** Enabled via middleware
