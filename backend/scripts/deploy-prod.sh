#!/bin/bash

# Exit on error
set -e

echo "Deploying backend to production..."

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run database migrations
npm run migrate

# Start the production server
NODE_ENV=production npm start

echo "Backend deployment completed successfully!" 