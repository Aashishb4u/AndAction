# AndAction - Quick Reference

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your Neon.tech DATABASE_URL and NEXTAUTH_SECRET

# 3. Set up database
npm run db:generate
npm run db:migrate

# 4. Start development server
npm run dev
```

## 📦 NPM Scripts

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### Database
```bash
npm run db:generate  # Generate Prisma Client
npm run db:migrate   # Create and apply migration
npm run db:push      # Push schema changes (no migration)
npm run db:studio    # Open Prisma Studio GUI
npm run db:reset     # Reset database (⚠️ deletes all data)
```

## 🗄️ Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create a migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate

# View migration status
npx prisma migrate status

# Reset database (development only)
npx prisma migrate reset
```

## 🔐 Environment Variables

### Required
```env
DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### Generate NextAuth Secret
```bash
openssl rand -base64 32
```

## 🌐 API Endpoints

### Health Check
```bash
# Check API and database status
curl http://localhost:3000/api/health
```

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

## 📊 Database Schema

### User Model
```typescript
{
  id: string
  email: string (unique)
  password?: string
  firstName?: string
  lastName?: string
  countryCode?: string
  phoneNumber?: string
  city?: string
  state?: string
  address?: string
  zip?: string
  avatar?: string
  role: "user" | "artist"
  isAccountVerified: boolean
  isArtistVerified: boolean
  gender?: string
  dob?: Date
  googleId?: string
  facebookId?: string
  appleId?: string
  createdAt: Date
  updatedAt: Date
}
```

### Artist Model
```typescript
{
  id: string
  userId: string (unique)
  stageName?: string
  artistType?: string
  subArtistType?: string
  achievements?: string
  yearsOfExperience?: number
  shortBio?: string
  performingLanguage?: string
  performingEventType?: string
  performingStates?: string
  performingDurationFrom?: string
  performingDurationTo?: string
  performingMembers?: string
  offStageMembers?: string
  contactNumber?: string
  whatsappNumber?: string
  contactEmail?: string
  soloChargesFrom?: Decimal
  soloChargesTo?: Decimal
  soloChargesDescription?: string
  chargesWithBacklineFrom?: Decimal
  chargesWithBacklineTo?: Decimal
  chargesWithBacklineDescription?: string
  youtubeChannelId?: string
  instagramId?: string
  createdAt: Date
  updatedAt: Date
}
```

## 🛠️ Common Tasks

### Create a User
```typescript
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    password: await hashPassword('password123'),
    firstName: 'John',
    lastName: 'Doe',
    role: 'user'
  }
})
```

### Find User with Artist Profile
```typescript
const user = await prisma.user.findUnique({
  where: { email: 'artist@example.com' },
  include: { artist: true }
})
```

### Create Artist Profile
```typescript
const artist = await prisma.artist.create({
  data: {
    userId: user.id,
    stageName: 'The Artist',
    artistType: 'Singer',
    shortBio: 'Professional singer...'
  }
})
```

### Update User
```typescript
const updated = await prisma.user.update({
  where: { id: userId },
  data: { firstName: 'Jane', city: 'Mumbai' }
})
```

## 🔍 Debugging

### Check Database Connection
```bash
npx prisma db pull
```

### View Database in GUI
```bash
npx prisma studio
# Opens at http://localhost:5555
```

### Check Migration Status
```bash
npx prisma migrate status
```

### View Logs
```bash
# Development server logs show Prisma queries
npm run dev
```

## 📁 Important Files

```
.env                    # Environment variables (not in git)
.env.example           # Environment template
prisma/schema.prisma   # Database schema
lib/prisma.ts          # Prisma client singleton
lib/password.ts        # Password utilities
lib/api-response.ts    # API response helpers
lib/types/database.ts  # TypeScript types
```

## 🆘 Troubleshooting

### "Can't reach database server"
- Check `DATABASE_URL` in `.env`
- Verify Neon.tech database is active
- Test network connectivity

### "Prisma Client not found"
```bash
npm run db:generate
```

### Migration errors
```bash
# Validate schema
npx prisma validate

# Reset database (dev only - deletes all data!)
npm run db:reset
```

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## 📚 Documentation

- [Backend Setup Guide](./BACKEND_SETUP.md)
- [API Documentation](./app/api/README.md)
- [Setup Complete](./SETUP_COMPLETE.md)
- [Main README](./README.md)

## 🔗 External Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Neon.tech Docs](https://neon.tech/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Next.js Docs](https://nextjs.org/docs)

