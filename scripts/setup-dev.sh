#!/bin/bash

# lookate Development Setup Script
echo "🚀 Setting up lookate for development..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# MongoDB Configuration - Update with your MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/livemap

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Environment
NODE_ENV=development

# Optional: OAuth Providers (uncomment and configure if using OAuth)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
EOF
    echo "✅ Environment file created with secure random secrets"
else
    echo "⚠️  .env.local already exists, skipping creation"
fi

# Check if MongoDB is running
echo "🗄️  Checking MongoDB connection..."
if mongosh --eval "db.adminCommand('ismaster')" --quiet >/dev/null 2>&1; then
    echo "✅ MongoDB is running and accessible"
else
    echo "❌ MongoDB is not running or not accessible"
    echo ""
    echo "📋 Setup MongoDB:"
    echo "Option 1 - Local MongoDB:"
    echo "  macOS: brew install mongodb-community && brew services start mongodb-community"
    echo "  Ubuntu: sudo apt install mongodb && sudo systemctl start mongodb"
    echo ""
    echo "Option 2 - MongoDB Atlas (Cloud):"
    echo "  1. Go to https://cloud.mongodb.com/"
    echo "  2. Create free cluster"
    echo "  3. Update MONGODB_URI in .env.local"
    echo ""
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "🚀 To start the application:"
echo "   npm run dev"
echo ""
echo "🌐 Then visit: http://localhost:3000"
echo ""
echo "📖 See README_BACKEND.md for detailed setup instructions"