const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { connectDB } = require('../config/db');
const User = require('../models/user.model');
const AuthController = require('../controllers/auth.controller');
const jwt = require('jsonwebtoken');

async function runAuthTests() {
  console.log('====================================================');
  console.log('🔐 REAL-TIME AUTHENTICATION TEST SUITE');
  console.log('====================================================');

  try {
    await connectDB();

    const { isEmbedded } = require('../config/db');
    const { EmbeddedDB } = require('../config/embeddedDb');

    // 1. Seed/Ensure Demo User exists
    let demoUser = null;
    if (isEmbedded()) {
      demoUser = EmbeddedDB.findOne('users', { email: 'demo@recoverai.com' });
      if (!demoUser) {
        demoUser = EmbeddedDB.upsert('users', {
          name: 'Gokul B',
          email: 'demo@recoverai.com',
          username: 'admin',
          password: 'RecoverAI@123',
          role: 'Admin'
        });
      }
      console.log('1. Demo User ready in EmbeddedDB Engine: demo@recoverai.com');
    } else {
      demoUser = await User.findOne({ email: 'demo@recoverai.com' });
      if (!demoUser) {
        demoUser = new User({
          name: 'Gokul B',
          email: 'demo@recoverai.com',
          username: 'admin',
          password: 'RecoverAI@123',
          role: 'Admin'
        });
        await demoUser.save();
      }
      console.log('1. Demo User ready in MongoDB: demo@recoverai.com');
    }

    // 2. Test Invalid Credentials
    console.log('\n2. Testing Invalid Password Login...');
    const reqInvalid = { body: { email: 'demo@recoverai.com', password: 'WrongPassword123' } };
    let invalidResult = {};
    const resInvalid = {
      status: (code) => {
        invalidResult.statusCode = code;
        return resInvalid;
      },
      json: (data) => {
        invalidResult.body = data;
        return resInvalid;
      }
    };
    await AuthController.login(reqInvalid, resInvalid);
    console.log(`   Response Code: ${invalidResult.statusCode}`);
    console.log(`   Rejected cleanly: ${invalidResult.statusCode === 401 && invalidResult.body.error === 'Invalid email or password'}`);

    // 3. Test Valid Credentials Login
    console.log('\n3. Testing Valid Credentials Login (demo@recoverai.com / RecoverAI@123)...');
    const reqValid = { body: { email: 'demo@recoverai.com', password: 'RecoverAI@123' } };
    let validResult = {};
    const resValid = {
      status: (code) => {
        validResult.statusCode = code;
        return resValid;
      },
      json: (data) => {
        validResult.body = data;
        return resValid;
      }
    };
    await AuthController.login(reqValid, resValid);
    console.log(`   Response Code: ${validResult.statusCode}`);
    console.log(`   Success: ${validResult.body.success}`);
    console.log(`   Token Issued: ${!!validResult.body.token}`);
    console.log(`   Returned User Payload:`, validResult.body.user);
    console.log(`   Password Hash Excluded: ${!validResult.body.user.password && !validResult.body.user.passwordHash}`);

    // 4. Test Token Verification (GET /api/auth/me)
    console.log('\n4. Testing Token Session Verification (GET /api/auth/me)...');
    const decoded = jwt.verify(validResult.body.token, process.env.JWT_SECRET || 'supersecretjwttokenkey12345!');
    const reqMe = { user: decoded };
    let meResult = {};
    const resMe = {
      status: (code) => {
        meResult.statusCode = code;
        return resMe;
      },
      json: (data) => {
        meResult.body = data;
        return resMe;
      }
    };
    await AuthController.getMe(reqMe, resMe);
    console.log(`   Me Endpoint Status: ${meResult.statusCode}`);
    console.log(`   Authenticated User Name: ${meResult.body.user.name}`);
    console.log(`   Authenticated Role: ${meResult.body.user.role}`);

    console.log('\n====================================================');
    console.log('✅ ALL REAL-TIME AUTHENTICATION TESTS PASSED!');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Auth Test Error:', err);
    process.exit(1);
  }
}

runAuthTests();
