#!/bin/bash

# AndAction Database Setup Script
# This script helps you set up the database for the first time

echo "🚀 AndAction Database Setup"
echo "============================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  Please edit .env and add your:"
    echo "   - DATABASE_URL (from Neon.tech)"
    echo "   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Check if DATABASE_URL is set
if grep -q "postgresql://user:password@host.neon.tech" .env; then
    echo "⚠️  DATABASE_URL is not configured!"
    echo ""
    echo "Please update DATABASE_URL in .env with your Neon.tech connection string"
    echo "Get it from: https://neon.tech"
    echo ""
    exit 1
fi

# Check if NEXTAUTH_SECRET is set
if grep -q "your-nextauth-secret-here" .env; then
    echo "⚠️  NEXTAUTH_SECRET is not configured!"
    echo ""
    echo "Generate a secret with:"
    echo "  openssl rand -base64 32"
    echo ""
    echo "Then update NEXTAUTH_SECRET in .env"
    echo ""
    exit 1
fi

echo "✅ Environment variables configured"
echo ""

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate
if [ $? -eq 0 ]; then
    echo "✅ Prisma Client generated"
else
    echo "❌ Failed to generate Prisma Client"
    exit 1
fi
echo ""

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init
if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed"
else
    echo "❌ Failed to run migrations"
    echo ""
    echo "Common issues:"
    echo "  - Check your DATABASE_URL is correct"
    echo "  - Ensure your Neon.tech database is active"
    echo "  - Verify network connectivity"
    exit 1
fi
echo ""

# Success message
echo "🎉 Database setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run dev' to start the development server"
echo "  2. Visit http://localhost:3000/api/health to verify"
echo "  3. Run 'npx prisma studio' to view your database"
echo ""

