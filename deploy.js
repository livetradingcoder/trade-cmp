#!/usr/bin/env node

const { execSync } = require("child_process");

console.log("🚀 Trade Arena Vercel Deployment Script");
console.log("=======================================\n");

// Check if Vercel CLI is installed
try {
  execSync("vercel --version", { stdio: "pipe" });
  console.log("✅ Vercel CLI found");
} catch (error) {
  console.log("❌ Vercel CLI not found. Installing...");
  execSync("npm install -g vercel", { stdio: "inherit" });
  console.log("✅ Vercel CLI installed\n");
}

console.log("📋 Deployment Steps:");
console.log("1. First, deploy the backend");
console.log("2. Then deploy the frontend\n");

console.log("🔧 To deploy everything, run these commands:");
console.log("");
console.log("   # Deploy backend");
console.log("   npm run deploy:backend");
console.log("");
console.log("   # Deploy frontend");
console.log("   npm run deploy:frontend");
console.log("");
console.log("   # Or deploy both at once");
console.log("   npm run deploy:vercel");
console.log("");

console.log("⚠️  Important: Make sure you have:");
console.log("   - Vercel account and CLI logged in (vercel login)");
console.log("   - Database URL set in backend environment variables");
console.log("   - Backend deployed first, then use its URL in frontend");

console.log("\n🎯 Ready to deploy! Use the commands above.");
