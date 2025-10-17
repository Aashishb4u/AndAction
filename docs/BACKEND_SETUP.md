# AndAction Backend Setup Guide

This document provides instructions for setting up and working with the AndAction backend.

## Tech Stack

- **ORM**: Prisma
- **Database**: PostgreSQL (Neon.tech - serverless)
- **Authentication**: NextAuth.js v5 (beta)
- **Password Hashing**: bcryptjs
- **Storage**: Local filesystem (within Next.js directory)

## Initial Setup

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure the following:

```bash
cp .env.example .env
```

#### Required Environment Variables:

**Database (Neon.tech):**
1. Go to [Neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string
4. Update `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="postgresql://user:password@host.neon.tech/andaction?sslmode=require"
   ```

**NextAuth:**
1. Generate a secret:
   ```bash
   openssl rand -base64 32
   ```
2. Update `NEXTAUTH_SECRET` in `.env`
3. Set `NEXTAUTH_URL` (default: `http://localhost:3000`)

### 2. Database Setup

#### Generate Prisma Client:
```bash
npx prisma generate
```

#### Run Database Migrations:
```bash
npx prisma migrate dev --name init
```

This will:
- Create the database tables based on your schema
- Generate the Prisma Client
- Apply the migration to your Neon.tech database

#### View Database in Prisma Studio:
```bash
npx prisma studio
```

This opens a GUI at `http://localhost:5555` to view and edit your database.

## Database Schema

### User Model
Main user table for authentication and profiles:
- **Authentication**: email, password, OAuth IDs (Google, Facebook, Apple)
- **Profile**: firstName, lastName, phone, location, avatar
- **Status**: role (user/artist), verification flags
- **Personal**: gender, dob, address

### Artist Model
Extended profile for artists (one-to-one with User):
- **Basic Info**: stageName, artistType, bio, experience
- **Performance**: languages, event types, states, duration, team size
- **Contact**: phone, WhatsApp, email
- **Pricing**: solo charges, charges with backline
- **Social**: YouTube channel ID, Instagram ID (for future API integration)

## Project Structure

```
app/
├── api/                    # API routes
│   ├── auth/              # Authentication endpoints (NextAuth)
│   ├── users/             # User management
│   ├── artists/           # Artist management
│   └── health/            # Health check endpoint
│
lib/
├── prisma.ts              # Prisma client singleton
├── password.ts            # Password hashing utilities
├── api-response.ts        # Standardized API responses
└── types/
    └── database.ts        # TypeScript types for database models

prisma/
└── schema.prisma          # Database schema
```

## API Conventions

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Using API Response Helpers

```typescript
import { successResponse, errorResponse, ApiErrors } from '@/lib/api-response'

// Success response
return successResponse({ user: userData }, 'User created successfully', 201)

// Error response
return errorResponse('Invalid email', 'INVALID_EMAIL', 400)

// Common errors
return ApiErrors.unauthorized()
return ApiErrors.notFound('User')
return ApiErrors.badRequest('Invalid input')
```

## Common Prisma Operations

### Create User
```typescript
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

const hashedPassword = await hashPassword(password)
const user = await prisma.user.create({
  data: {
    email,
    password: hashedPassword,
    firstName,
    lastName,
    role: 'user'
  }
})
```

### Find User with Artist Profile
```typescript
const user = await prisma.user.findUnique({
  where: { email },
  include: { artist: true }
})
```

### Create Artist Profile
```typescript
const artist = await prisma.artist.create({
  data: {
    userId: user.id,
    stageName: 'Artist Name',
    artistType: 'Singer',
    // ... other fields
  }
})
```

### Update User
```typescript
const updatedUser = await prisma.user.update({
  where: { id: userId },
  data: { firstName, lastName, city }
})
```

## Testing the Setup

### 1. Check API Health
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-10T...",
  "service": "AndAction API",
  "database": "connected"
}
```

### 2. Test Database Connection
```bash
npx prisma db pull
```

This should connect to your Neon.tech database successfully.

## Development Workflow

### Making Schema Changes

1. Edit `prisma/schema.prisma`
2. Create a migration:
   ```bash
   npx prisma migrate dev --name description_of_change
   ```
3. Prisma Client is automatically regenerated

### Resetting Database (Development Only)
```bash
npx prisma migrate reset
```
⚠️ This will delete all data!

## Next Steps

1. **Set up Neon.tech database** and update `.env`
2. **Run migrations**: `npx prisma migrate dev --name init`
3. **Test health endpoint**: Visit `http://localhost:3000/api/health`
4. **Implement authentication** with NextAuth.js
5. **Create user registration/login endpoints**
6. **Build artist profile management APIs**

## Useful Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name migration_name

# Open Prisma Studio
npx prisma studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate

# View migration status
npx prisma migrate status
```

## Troubleshooting

### "Can't reach database server"
- Check your `DATABASE_URL` in `.env`
- Ensure your Neon.tech database is active
- Verify network connectivity

### "Prisma Client not found"
- Run `npx prisma generate`

### Migration errors
- Check schema syntax: `npx prisma validate`
- Reset database (dev only): `npx prisma migrate reset`

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Neon.tech Documentation](https://neon.tech/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

