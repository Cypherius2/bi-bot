@echo off
echo 🚀 Deploying AI Workflow System to Vercel...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the workflow system directory.
    pause
    exit /b 1
)

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Check if user is logged in
vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔐 Please log in to Vercel...
    vercel login
    if %errorlevel% neq 0 (
        echo ❌ Login failed. Please try again.
        pause
        exit /b 1
    )
)

REM Create .env.local if it doesn't exist
if not exist ".env.local" (
    echo 📝 Creating .env.local from template...
    copy .env.example .env.local >nul
    echo ⚠️  Please edit .env.local with your configuration before deploying!
    echo    Required variables:
    echo    - BOT_API_BASE: Your bot API URL
    echo    - NEXTAUTH_SECRET: Random secret string
    echo    - NEXTAUTH_URL: Your deployment URL
    echo.
    set /p "continue=Press Enter when you've configured .env.local..."
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Build the project
echo 🔨 Building project...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
call vercel --prod
if %errorlevel% neq 0 (
    echo ❌ Deployment failed
    pause
    exit /b 1
)

echo ✅ Deployment complete!
echo.
echo 🎉 Your AI Workflow System is now live!
echo 📋 Next steps:
echo    1. Update your bot's CORS settings to allow the workflow system
echo    2. Configure environment variables in the Vercel dashboard
echo    3. Test the integration by creating a workflow
echo.
echo 📚 Documentation: README.md
echo 🔗 Integration Guide: VERCEL_INTEGRATION_GUIDE.md
echo.
pause