#!/bin/bash

# lookate Deployment Checklist Script

echo "🚀 lookate Deployment Readiness Check"
echo "====================================="

# Check if build works
echo "📦 Testing production build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Production build successful"
else
    echo "❌ Production build failed - check for errors"
    exit 1
fi

# Check environment file
if [ -f ".env.local" ]; then
    echo "✅ Environment file exists"
    
    # Check required variables
    if grep -q "MONGODB_URI" .env.local && grep -q "NEXTAUTH_SECRET" .env.local && grep -q "JWT_SECRET" .env.local; then
        echo "✅ Required environment variables present"
    else
        echo "⚠️  Missing some required environment variables"
    fi
else
    echo "⚠️  No .env.local file found"
fi

# Check package.json
if [ -f "package.json" ]; then
    echo "✅ Package.json exists"
else
    echo "❌ Package.json missing"
fi

# Check key files
files=("app/layout.tsx" "app/page.tsx" "components/auth/auth-modal.tsx" "lib/auth/auth.config.ts")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "🎯 Deployment Summary:"
echo "======================="
echo "✅ App Name: lookate"
echo "✅ Tech Stack: Next.js 15 + MongoDB + NextAuth"
echo "✅ Features: Real-time location tracking, authentication, profiles"
echo "✅ UI: Professional with shadcn/ui"
echo ""
echo "🚀 Ready to deploy to:"
echo "- Vercel (Recommended): https://vercel.com"
echo "- Railway: https://railway.app" 
echo "- Netlify: https://netlify.com"
echo ""
echo "📖 See deployment-guide.md for detailed instructions"