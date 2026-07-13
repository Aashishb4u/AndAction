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



# Instagram Discovery Logic - 


1. It runs 10 times in 24 hours
   
   - scripts/cron-jobs.js spreads the cron evenly across the day.
   - So it does not run all discovery work at once.
   - It takes 10 small turns per day .

2. Each run remembers where it stopped
   
   - We store the current progress in the database.
   - That means after one run finishes, the next run continues from the next step instead of starting again from the first city/category/page.

3. It now rotates through cities
   
   - Earlier it was basically stuck on one city.
   - Now we have a list of cities/locations in DB.
   - Example: Mumbai -> Delhi -> Bengaluru -> next city...
4. Within each city, it rotates through categories
   
   - Example:
     - Live Band
     - Singer
     - DJ/VJ
     - etc.

5. Within each category, it rotates through pages/results
   
   - It does page 1, then page 2, then page 3, based on:
     - start
     - startIncrement
     - pagesPerQuery

6. When one city is fully done, it moves to the next city
   
   - “Fully done” means:
     - all pages of current category done
     - then next category
     - and after all categories are done
     - it switches to the next city
     
So the real flow is:

- Run 1: Mumbai + Category 1 + Page 1
- Run 2: Mumbai + Category 1 + Page 2
- Run 3: Mumbai + Category 1 + Page 3
- ...
- then Mumbai + Category 2
- ...
- after all Mumbai categories/pages finish -> move to Delhi
- then same cycle for Delhi
- then Bengaluru
- and so on
So when you say “bucket of 10 and 24 hours” , the easiest way to think about it is:

- 24 hours = full day window
- 10 runs = 10 chances in that day
- each run picks up the next saved bucket/slot of work
- the “bucket” is not a separate table, it is the saved cursor state in DB :
  - current city index
  - current category index
  - current page/start
So yes, the cron is now doing small rotating discovery batches across cities over the day .