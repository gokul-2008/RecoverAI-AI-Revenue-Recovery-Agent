const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const RazorpayService = require('../services/razorpay/razorpay.service');

async function testRazorpayDirect() {
  console.log('====================================================');
  console.log('🔍 DIRECT RAZORPAY TEST MODE AUTHENTICATION & LINK TEST');
  console.log('====================================================');

  console.log('1. Checking Environment Variables...');
  console.log('   RAZORPAY_KEY_ID:', RazorpayService.getKeyId());
  console.log('   RAZORPAY_KEY_SECRET length:', RazorpayService.getKeySecret().length);

  console.log('\n2. Testing Read-Only API Authentication...');
  const authRes = await RazorpayService.verifyAuthentication();
  console.log('   Auth Status:', authRes);

  if (!authRes.authenticated) {
    console.log('\n❌ [RAZORPAY AUTHENTICATION FAILED]');
    console.log('👉 Reason:', authRes.error || authRes.reason);
    console.log('👉 Solution: Please edit backend/.env and replace RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET with your active Razorpay Test Key Pair from https://dashboard.razorpay.com/app/keys');
    process.exit(1);
  }

  console.log('\n3. Testing Payment Link Creation via Official Razorpay API...');
  try {
    const payment = { amount: 2499 };
    const customer = { name: 'Test User', email: 'test@example.com', phone: '9876543210' };
    const result = await RazorpayService.createPaymentLink(payment, customer, 'case_test_direct', false);
    console.log('\n✅ [RAZORPAY TEST API SUCCESS!]');
    console.log('👉 Official Payment Link ID:', result.id);
    console.log('👉 Official Short URL:', result.short_url);
    console.log('👉 Link Status:', result.status);
    console.log('\n====================================================');
  } catch (err) {
    console.error('\n❌ [RAZORPAY API CREATION ERROR]:', err.message);
  }
}

testRazorpayDirect();
