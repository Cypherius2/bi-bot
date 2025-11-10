#!/bin/bash

# AI Workflow System Deployment Script for Vercel
# This script helps deploy the Next.js workflow system to Vercel

set -e

echo "🚀 Deploying AI Workflow System to Vercel..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the workflow system directory."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local with your configuration before deploying!"
    echo "   Required variables:"
    echo "   - BOT_API_BASE: Your bot API URL"
    echo "   - NEXTAUTH_SECRET: Random secret string"
    echo "   - NEXTAUTH_URL: Your deployment URL"
    read -p "Press Enter when you've configured .env.local..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "🎉 Your AI Workflow System is now live!"
echo "📋 Next steps:"
echo "   1. Update your bot's CORS settings to allow the workflow system"
echo "   2. Configure environment variables in the Vercel dashboard"
echo "   3. Test the integration by creating a workflow"
echo ""
echo "📚 Documentation: README.md"
echo "🔗 Integration Guide: VERCEL_INTEGRATION_GUIDE.md"