#!/bin/bash

# Exit on error
set -e

echo "Building frontend for production..."

# Install dependencies
npm install

# Build the application
npm run build:prod

# Create a production build directory
mkdir -p dist/production

# Copy the built files to the production directory
cp -r dist/* dist/production/

echo "Frontend build completed successfully!" 