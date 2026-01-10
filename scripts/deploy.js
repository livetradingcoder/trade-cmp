#!/usr/bin/env node

const { execSync } = require('child_process');
const platform = process.argv[2]; // 'render' or undefined for Vercel

if (platform === 'render') {
  console.log('🚀 Trade Arena Render Deployment Guide');
  console.log('=======================================\n');

  console.log('📋 Render Deployment Steps:');
  console.log('1. Create Render account at https://render.com');
  console.log('2. Create PostgreSQL database (free tier available)');
  console.log('3. Create Web Service for backend:');
  console.log('   - Repository: livetradingcoder/trade-cmp');
  console.log('   - Root Directory: packages/server');
  console.log('   - Build Command: npm install && npm run build');
  console.log('   - Start Command: npm start');
  console.log('4. Create Static Site for frontend:');
  console.log('   - Repository: livetradingcoder/trade-cmp');
  console.log('   - Root Directory: packages/web');
  console.log('   - Build Command: npm install && npm run build');
  console.log('   - Publish Directory: dist');
  console.log('5. Set environment variables:');
  console.log('   - Backend: DATABASE_URL (from PostgreSQL database)');
  console.log('   - Frontend: VITE_API_URL (backend service URL)');
  console.log('6. After deployment, run database commands in backend service shell:');
  console.log('   npm run db:push && npm run db:seed');

  console.log('\n🔗 Useful Links:');
  console.log('- Render Dashboard: https://dashboard.render.com');
  console.log('- Full Guide: Check DEPLOYMENT.md');

} else {
  // Vercel deployment (default)
  console.log('🚀 Trade Arena Vercel Deployment Script');
  console.log('=======================================\n');

  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    console.log('✅ Vercel CLI found');
  } catch (error) {
    console.log('❌ Vercel CLI not found. Installing...');
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('✅ Vercel CLI installed\n');
  }

  console.log('📋 Deployment Steps:');
  console.log('1. First, deploy the backend');
  console.log('2. Then deploy the frontend\n');

  console.log('🔧 To deploy everything, run these commands:');
  console.log('');
  console.log('   # Deploy backend');
  console.log('   npm run deploy:backend');
  console.log('');
  console.log('   # Deploy frontend');
  console.log('   npm run deploy:frontend');
  console.log('');
  console.log('   # Or deploy both at once');
  console.log('   npm run deploy:vercel');
  console.log('');

  console.log('⚠️  Important: Make sure you have:');
  console.log('   - Vercel account and CLI logged in (vercel login)');
  console.log('   - Database URL set in backend environment variables');
  console.log('   - Backend deployed first, then use its URL in frontend');

  console.log('\n🎯 Ready to deploy! Use the commands above.');
}