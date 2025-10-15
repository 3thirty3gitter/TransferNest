#!/bin/bash
# Production Deployment Script for TransferNest

echo "🚀 Starting TransferNest Production Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the application
echo "🔨 Building application..."
npm run build

# Check build status
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

# Build Firebase Functions
echo "🔧 Building Firebase Functions..."
cd functions
npm ci
npm run build
cd ..

# Deploy to Firebase (if Firebase CLI is available)
if command -v firebase &> /dev/null; then
    echo "🚀 Deploying to Firebase..."
    firebase deploy
else
    echo "⚠️  Firebase CLI not found. Skipping deployment."
    echo "   To deploy manually, run: firebase deploy"
fi

echo "🎉 Deployment process completed!"
