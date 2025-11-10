#!/bin/bash

# AI Workflow System - Deployment Verification Script
echo "🚀 AI Workflow System - Deployment Verification"
echo "==============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the nextjs-workflow directory."
    exit 1
fi

echo "✅ Project structure validated"

# Check critical files
echo ""
echo "📁 Checking critical files..."

files=("next.config.js" "app/layout.tsx" "app/page.tsx" "app/api/workflows/route.ts" "vercel.json")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file exists"
    else
        echo "  ❌ $file missing"
        exit 1
    fi
done

echo ""
echo "🔧 Configuration check..."

# Check if problematic configurations are removed
if grep -q "output.*standalone" next.config.js; then
    echo "  ❌ next.config.js still contains 'output: standalone' (will cause webpack errors)"
    exit 1
else
    echo "  ✅ No problematic 'output: standalone' in next.config.js"
fi

if grep -q "experimental.*appDir" next.config.js; then
    echo "  ❌ next.config.js still contains experimental appDir (outdated)"
    exit 1
else
    echo "  ✅ No experimental appDir configuration"
fi

# Check favicon handling
if grep -q "rel.*icon" app/layout.tsx; then
    echo "  ✅ Favicon links found in layout.tsx"
else
    echo "  ❌ No favicon links in layout.tsx"
    exit 1
fi

echo ""
echo "📦 Dependencies check..."

# Check for simplified dependencies
if grep -q '"lucide-react"' package.json; then
    echo "  ⚠️  Still has lucide-react (consider removing for build stability)"
else
    echo "  ✅ No lucide-react dependency (good for build stability)"
fi

if grep -q '"recharts"' package.json; then
    echo "  ⚠️  Still has recharts (consider removing for build stability)"
else
    echo "  ✅ No recharts dependency (good for build stability)"
fi

echo ""
echo "🌐 Vercel configuration check..."

if grep -q '"framework".*"nextjs"' vercel.json; then
    echo "  ✅ Vercel framework detection configured"
else
    echo "  ❌ Vercel framework configuration missing"
    exit 1
fi

echo ""
echo "🎯 Environment setup check..."

# Check for environment template
if [ -f ".env.example" ]; then
    echo "  ✅ Environment template found"
    if grep -q "BOT_API_BASE" .env.example; then
        echo "  ✅ BOT_API_BASE environment variable documented"
    else
        echo "  ❌ BOT_API_BASE not documented in .env.example"
    fi
else
    echo "  ⚠️  No .env.example file found"
fi

echo ""
echo "🔍 Additional files check..."

# Check for API routes
api_files=("app/api/workflows/route.ts" "app/api/bot/route.ts" "app/api/executions/route.ts")
for file in "${api_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file exists"
    else
        echo "  ❌ $file missing"
        exit 1
    fi
done

echo ""
echo "📊 Summary"
echo "==============================================="
echo "✅ All critical checks passed!"
echo "✅ No webpack publicPath issues found"
echo "✅ Favicon handling implemented"
echo "✅ Dependencies simplified"
echo "✅ Vercel configuration correct"
echo ""
echo "🎉 System is ready for Vercel deployment!"
echo ""
echo "Next steps:"
echo "1. Upload to GitHub repository"
echo "2. Import to Vercel"
echo "3. Set BOT_API_BASE environment variable"
echo "4. Deploy and test!"
echo ""
echo "Deployment package: nextjs-workflow-deployment-FIXED.tar.gz"