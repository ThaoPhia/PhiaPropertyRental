#!/bin/bash
# PhiaRental - Setup Helper Script
# This script automates the initial setup process

set -e

PROJECT_DIR="/Users/phiathao/Code/Phia/NextJS/PhiaRentalLLC"

echo "🏠 PhiaRental - Setup Assistant"
echo "========================================"
echo ""

# Check if in correct directory
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo "❌ Project directory not found or not set up correctly"
    echo "Expected: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

echo "✅ Project directory found: $PROJECT_DIR"
echo ""

# Step 1: Check Node.js
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION found"
echo ""

# Step 2: Install dependencies
echo "📥 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 3: Build check
echo "🔨 Building project..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "⚠️ Build had warnings (check manually with: npm run build)"
fi
echo ""

# Step 4: Database instructions
echo "🗄️ Database Setup Instructions"
echo "================================"
echo ""
echo "SQLite is file-based, so no external DB server is required."
echo ""
echo "On first app run, the database will be auto-created at:"
echo "  ./database/phiarentalllc.db"
echo ""
echo "If you need to reset it, run:"
echo "  rm -f database/phiarentalllc.db"
echo ""

# Step 5: Environment setup
echo "⚙️ Environment Setup"
echo "====================="
echo ""
if [ -f ".env.local" ]; then
    echo "✅ .env.local already exists"
    echo ""
    echo "Review and update if needed (shown below):"
    echo "---"
    cat .env.local | sed 's/=.*$/=****/' || true
    echo "---"
else
    echo "❌ .env.local not found"
    echo ""
    echo "Creating .env.local..."
    cat > .env.local << 'EOF'
SQLITE_DB_PATH=./database/phiarentalllc.db
NEXT_PUBLIC_API_URL=http://localhost:3000
EOF
    echo "✅ .env.local created with default values"
    echo ""
    echo "⚠️ IMPORTANT: Update SQLITE_DB_PATH in .env.local if needed"
fi
echo ""

# Step 6: Ready to start
echo "🚀 Ready to Start!"
echo "==================="
echo ""
echo "Next steps:"
echo "1. Update SQLITE_DB_PATH in .env.local if needed"
echo "2. Start the app (DB auto-initializes)"
echo "3. Start development server:"
echo ""
echo "   npm run dev"
echo ""
echo "4. Open in browser:"
echo "   http://localhost:3000"
echo ""
echo "For more information, see:"
echo "  - QUICK_START.md - Quick start guide"
echo "  - README.md - Full documentation"
echo "  - PROJECT_SUMMARY.md - Project overview"
echo ""
