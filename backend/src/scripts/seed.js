const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { connectDB, isEmbedded } = require('../config/db');
const { EmbeddedDB } = require('../config/embeddedDb');

const Customer = require('../models/customer.model');
const RecoveryEngine = require('../services/recovery/engine');

const demoCustomers = [
  {
    name: 'Ananya Sharma (Demo)',
    email: 'scenario1@recoverai.demo',
    phone: '9876543210',
    totalSuccessfulPayments: 8,
    totalFailedPayments: 1,
    totalSpent: 19992,
    customerRiskScore: 11
  },
  {
    name: 'Rajesh Kumar (Demo)',
    email: 'scenario2@recoverai.demo',
    phone: '9812345678',
    totalSuccessfulPayments: 0,
    totalFailedPayments: 4,
    totalSpent: 0,
    customerRiskScore: 100
  },
  {
    name: 'Vikram Singh (Demo)',
    email: 'scenario3@recoverai.demo',
    phone: '9988776655',
    totalSuccessfulPayments: 5,
    totalFailedPayments: 0,
    totalSpent: 4995,
    customerRiskScore: 0
  },
  {
    name: 'Sneha Patel (Demo)',
    email: 'scenario4@recoverai.demo',
    phone: '9123456789',
    totalSuccessfulPayments: 1,
    totalFailedPayments: 3,
    totalSpent: 1000,
    customerRiskScore: 75
  }
];

async function seed() {
  console.log('[SEED] Starting MongoDB development database seed script...');

  try {
    await connectDB();

    console.log('[SEED] Seeding primary Demo User account...');
    const User = require('../models/user.model');
    const demoUserData = {
      name: 'Gokul B',
      email: 'demo@recoverai.com',
      username: 'admin',
      password: 'RecoverAI@123',
      role: 'Admin'
    };

    if (isEmbedded()) {
      EmbeddedDB.upsert('users', demoUserData);
      console.log(`  ✓ Demo User seeded (Embedded): ${demoUserData.name} (${demoUserData.email})`);
    } else {
      let user = await User.findOne({ email: demoUserData.email });
      if (!user) {
        user = new User(demoUserData);
        await user.save();
        console.log(`  ✓ Demo User created (Mongoose): ${user.name} (${user.email})`);
      } else {
        user.name = demoUserData.name;
        user.role = demoUserData.role;
        await user.save();
        console.log(`  ✓ Demo User updated (Mongoose): ${user.name} (${user.email})`);
      }
    }

    console.log('[SEED] Upserting demo customer profiles and transaction ledgers...');
    const seededCustomers = [];

    for (const custData of demoCustomers) {
      if (isEmbedded()) {
        const customer = EmbeddedDB.upsert('customers', custData);
        seededCustomers.push(customer);
        console.log(`  ✓ Customer seeded (Embedded): ${customer.name} (${customer.email}) - ${customer.totalSuccessfulPayments} successes, ${customer.totalFailedPayments} failures`);
      } else {
        const customer = await Customer.findOneAndUpdate(
          { email: custData.email },
          custData,
          { upsert: true, new: true, runValidators: true }
        );
        seededCustomers.push(customer);
        console.log(`  ✓ Customer seeded (Mongoose): ${customer.name} (${customer.email}) - ${customer.totalSuccessfulPayments} successes, ${customer.totalFailedPayments} failures`);
      }
    }

    const Payment = require('../models/payment.model');
    const historicalPayments = [
      { razorpayPaymentId: 'pay_hist_ananya_1', email: 'scenario1@recoverai.demo', amount: 2499, status: 'captured', method: 'upi' },
      { razorpayPaymentId: 'pay_hist_ananya_2', email: 'scenario1@recoverai.demo', amount: 2499, status: 'captured', method: 'upi' },
      { razorpayPaymentId: 'pay_hist_ananya_3', email: 'scenario1@recoverai.demo', amount: 2499, status: 'captured', method: 'card' },
      { razorpayPaymentId: 'pay_hist_ananya_4', email: 'scenario1@recoverai.demo', amount: 2499, status: 'captured', method: 'netbanking' },
      { razorpayPaymentId: 'pay_hist_ananya_5', email: 'scenario1@recoverai.demo', amount: 2499, status: 'captured', method: 'upi' },
      { razorpayPaymentId: 'pay_hist_ananya_6', email: 'scenario1@recoverai.demo', amount: 2499, status: 'captured', method: 'upi' },
      { razorpayPaymentId: 'pay_hist_ananya_7', email: 'scenario1@recoverai.demo', amount: 2499, status: 'captured', method: 'card' },
      { razorpayPaymentId: 'pay_hist_ananya_8', email: 'scenario1@recoverai.demo', amount: 2499, status: 'captured', method: 'upi' },
      { razorpayPaymentId: 'pay_hist_vikram_1', email: 'scenario3@recoverai.demo', amount: 999, status: 'captured', method: 'upi' },
      { razorpayPaymentId: 'pay_hist_vikram_2', email: 'scenario3@recoverai.demo', amount: 999, status: 'captured', method: 'upi' },
      { razorpayPaymentId: 'pay_hist_vikram_3', email: 'scenario3@recoverai.demo', amount: 999, status: 'captured', method: 'netbanking' },
      { razorpayPaymentId: 'pay_hist_vikram_4', email: 'scenario3@recoverai.demo', amount: 999, status: 'captured', method: 'upi' },
      { razorpayPaymentId: 'pay_hist_vikram_5', email: 'scenario3@recoverai.demo', amount: 999, status: 'captured', method: 'upi' },
      { razorpayPaymentId: 'pay_hist_sneha_1', email: 'scenario4@recoverai.demo', amount: 1000, status: 'captured', method: 'upi' }
    ];

    for (const hp of historicalPayments) {
      let cust = seededCustomers.find(c => c.email === hp.email);
      if (cust) {
        if (isEmbedded()) {
          EmbeddedDB.upsert('payments', {
            razorpayPaymentId: hp.razorpayPaymentId,
            customerId: cust._id,
            amount: hp.amount,
            currency: 'INR',
            status: hp.status,
            method: hp.method,
            mode: 'demo'
          });
        } else {
          await Payment.findOneAndUpdate(
            { razorpayPaymentId: hp.razorpayPaymentId },
            {
              razorpayPaymentId: hp.razorpayPaymentId,
              customerId: cust._id,
              amount: hp.amount,
              currency: 'INR',
              status: hp.status,
              method: hp.method,
              mode: 'demo'
            },
            { upsert: true }
          );
        }
      }
    }

    console.log('[SEED] Initializing default recovery cases for Demo and Test modes...');

    // Seed Demo Case
    await RecoveryEngine.handlePaymentFailure({
      razorpayPaymentId: 'pay_demo_seed_1',
      customerDetails: { name: 'Ananya Sharma (Demo)', email: 'scenario1@recoverai.demo', phone: '9876543210' },
      amount: 2499,
      currency: 'INR',
      method: 'upi',
      failureReason: 'Temporary bank gateway failure (auth_degraded)'
    }, true);

    // Seed Test Case
    await RecoveryEngine.handlePaymentFailure({
      razorpayPaymentId: 'pay_test_seed_1',
      customerDetails: { name: 'Ananya Sharma (Demo)', email: 'scenario1@recoverai.demo', phone: '9876543210' },
      amount: 2499,
      currency: 'INR',
      method: 'upi',
      failureReason: 'Temporary bank gateway failure (auth_degraded)'
    }, false);

    console.log(`====================================================`);
    console.log(`[SEED SUCCESS] Idempotent database seeding completed!`);
    console.log(`👉 Total Demo & Test Data Ready`);
    console.log(`====================================================`);

    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error(`[SEED ERROR] Failed to seed database: ${error.message}`);
    if (require.main === module) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
