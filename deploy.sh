#!/bin/bash

echo "Deploying SITA Bot Backend to EC2..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Start with PM2
echo " Starting application with PM2..."
pm2 stop sita-bot-backend 2>/dev/null || true
pm2 delete sita-bot-backend 2>/dev/null || true
pm2 start src/index.js --name sita-bot-backend

# Save PM2 configuration
pm2 save
pm2 startup

echo " Backend deployed successfully!"
echo " Check logs with: pm2 logs sita-bot-backend"
echo " Check status with: pm2 status"
