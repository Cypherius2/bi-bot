#!/bin/bash

# Setup script for AI Workflow System development environment

echo "🔧 Setting up AI Workflow System development environment..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment file
if [ ! -f ".env.local" ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local with your configuration"
    echo ""
    echo "Example configuration:"
    echo "BOT_API_BASE=http://localhost:8000/api"
    echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
    echo "NEXTAUTH_URL=http://localhost:3000"
    echo ""
fi

# Setup pre-commit hooks (optional)
if command -v husky &> /dev/null; then
    echo "🔧 Setting up pre-commit hooks..."
    npx husky install
    npx husky add .husky/pre-commit "npm run lint"
fi

# Check for development tools
echo ""
echo "🔍 Checking development tools..."

# Check for VS Code extensions
if command -v code &> /dev/null; then
    echo "📝 VS Code detected. Recommended extensions:"
    echo "   - esbenp.prettier-vscode"
    echo "   - dbaeumer.vscode-eslint"
    echo "   - bradlc.vscode-tailwindcss"
fi

# Final setup message
echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Development commands:"
echo "   npm run dev      - Start development server"
echo "   npm run build    - Build for production"
echo "   npm run start    - Start production server"
echo "   npm run lint     - Run linting"
echo ""
echo "🚀 Deployment:"
echo "   ./deploy.sh      - Deploy to Vercel (Linux/Mac)"
echo "   deploy.bat       - Deploy to Vercel (Windows)"
echo ""
echo "📚 Documentation:"
echo "   README.md                    - Main documentation"
echo "   VERCEL_INTEGRATION_GUIDE.md  - Integration with existing bot"
echo ""
echo "Happy coding! 🚀"