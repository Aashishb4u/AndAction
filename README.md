# AndAction

A modern platform for artists and performers built with Next.js 15, featuring artist profiles, video content, and booking management.

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **UI Components**: Custom components with Lucide React icons
- **Language**: TypeScript

### Backend
- **ORM**: Prisma
- **Database**: PostgreSQL (Neon.tech - serverless)
- **Authentication**: NextAuth.js v5
- **Password Hashing**: bcryptjs
- **Storage**: Local filesystem

## Getting Started

### Prerequisites
- Node.js 20+ installed
- npm or yarn package manager
- Neon.tech account (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd and-action
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and configure:
   - `DATABASE_URL` - Your Neon.tech PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` - Your app URL (default: `http://localhost:3000`)

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev --name init
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Verify Setup

Check if the backend is working:
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "service": "AndAction API"
}
```

## Project Structure

```
and-action/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── artists/           # Artist pages
│   ├── videos/            # Video content pages
│   └── ...
├── components/            # React components
│   ├── sections/          # Page sections
│   └── ui/                # Reusable UI components
├── lib/                   # Utility functions
│   ├── prisma.ts         # Prisma client
│   ├── password.ts       # Password utilities
│   ├── api-response.ts   # API response helpers
│   └── types/            # TypeScript types
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Prisma schema
└── public/               # Static assets
```

## Documentation

- **[Backend Setup Guide](./BACKEND_SETUP.md)** - Detailed backend configuration and usage
- **[API Documentation](./app/api/README.md)** - API endpoints and conventions

## Database Schema

### User Model
- Authentication (email, password, OAuth)
- Profile information
- Account verification status
- Role management (user/artist)

### Artist Model
- Extended artist profile
- Performance details
- Pricing information
- Social media integration

View the complete schema in `prisma/schema.prisma`

## Development

### Useful Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Prisma commands
npx prisma studio          # Open database GUI
npx prisma generate        # Generate Prisma Client
npx prisma migrate dev     # Create and apply migration
npx prisma format          # Format schema file
```

### Database Management

```bash
# View database in GUI
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (development only)
npx prisma migrate reset
```

## Features

- ✅ User authentication (email/password)
- ✅ Artist profiles and management
- ✅ Video content browsing
- ✅ Shorts/Reels functionality
- ✅ Bookmark system
- 🚧 Social OAuth (Google, Facebook, Apple) - Coming soon
- 🚧 Artist booking system - Coming soon
- 🚧 Payment integration - Coming soon

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions, please open an issue on GitHub.
