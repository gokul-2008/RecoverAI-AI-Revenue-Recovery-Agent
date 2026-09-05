const dotenv = require('dotenv');
const path = require('path');

// Load environment configuration
dotenv.config({ path: path.join(__dirname, '../.env') });

const { connectDB, isConnected } = require('./config/db');
const app = require('./app');
const { evaluate } = require('./scripts/evaluate');
const RazorpayService = require('./services/razorpay/razorpay.service');

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('Connecting to MongoDB...');

  let dbConnected = false;
  try {
    await connectDB();
    dbConnected = true;
  } catch (error) {
    // Error is logged by connectDB
  }

  // Pre-run evaluation dataset generator if missing
  try {
    evaluate();
  } catch (evalErr) {
    console.warn('[EVALUATION] Dataset initialization warning:', evalErr.message);
  }

  const rzpConfigured = RazorpayService.isConfigured();
  const keyId = RazorpayService.getKeyId();
  const secret = RazorpayService.getKeySecret();
  const rzpMaskedKey = keyId.length >= 10 
    ? `${keyId.slice(0, 8)}****${keyId.slice(-4)}`
    : (keyId || 'NOT_SET');

  let rzpAuthResult = { authenticated: false };
  if (rzpConfigured) {
    rzpAuthResult = await RazorpayService.verifyAuthentication();
  }

  const server = app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`Server running on port ${PORT}`);
    console.log(`👉 Database Status: ${dbConnected ? 'connected' : 'disconnected'}`);
    console.log(`👉 REST API Base URL: http://localhost:${PORT}/api`);
    console.log(`👉 Razorpay Webhook URL: http://localhost:${PORT}/api/webhooks/razorpay`);
    console.log(``);
    if (rzpConfigured) {
      if (rzpAuthResult.authenticated) {
        console.log(`👉 Razorpay TEST API: AUTHENTICATED & READY`);
      } else {
        console.log(`👉 Razorpay TEST API: CONFIGURED (Authentication Failed: ${rzpAuthResult.error || rzpAuthResult.reason})`);
      }
      console.log(`   Razorpay Key ID Present: true`);
      console.log(`   Razorpay Key ID TEST Prefix: true`);
      console.log(`   Razorpay Key ID: ${rzpMaskedKey}`);
      console.log(`   Razorpay Key Secret Present: true`);
      console.log(`   Razorpay Key Secret Length: ${secret.length}`);
      console.log(`   API Auth Verified: ${rzpAuthResult.authenticated}`);
    } else {
      console.log(`👉 Razorpay TEST API: NOT CONFIGURED`);
      console.log(`   Razorpay Key ID Present: ${Boolean(keyId)}`);
      console.log(`   Razorpay Key Secret Present: ${Boolean(secret)}`);
    }
    console.log(``);
    console.log(`👉 AI Provider Mode: ${process.env.AI_PROVIDER || 'MOCK'}`);
    console.log(`====================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ [PORT ERROR] Port ${PORT} is already in use by another running backend process.`);
      console.error(`👉 To resolve: Stop the existing backend server process or run: Stop-Process -Name node -Force\n`);
      process.exit(1);
    } else {
      console.error('❌ Server startup error:', err);
      process.exit(1);
    }
  });
}

startServer();
