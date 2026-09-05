const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { connectDB } = require('../config/db');
const AuthController = require('../controllers/auth.controller');

async function runRegistrationSuite() {
  console.log('====================================================');
  console.log('🔐 REAL-TIME REGISTRATION & LOGIN SUITE');
  console.log('====================================================');

  try {
    await connectDB();

    const testUser = {
      name: 'Test Registration User',
      email: `testuser_${Date.now()}@recoverai.com`,
      password: 'SecurePassword123!'
    };

    // 1. Test Real-time Registration
    console.log('\n1. Testing Registration Endpoint (POST /api/auth/register)...');
    let regStatusCode = 200;
    let regResponse = {};
    const reqReg = { body: testUser };
    const resReg = {
      status: (code) => {
        regStatusCode = code;
        return {
          json: (data) => {
            regResponse = data;
            return data;
          }
        };
      }
    };

    await AuthController.register(reqReg, resReg);
    console.log('   Status Code:', regStatusCode);
    console.log('   Success:', regResponse.success);
    console.log('   Message:', regResponse.message);
    console.log('   Returned User Payload:', regResponse.user);
    console.log('   Password Hash Excluded:', !regResponse.user.password);
    console.log('   JWT Token Issued:', !!regResponse.token);

    if (regStatusCode !== 201 || !regResponse.token) {
      throw new Error('Registration failed!');
    }

    // 2. Test Duplicate Email Prevention
    console.log('\n2. Testing Duplicate Registration Prevention...');
    let dupStatusCode = 200;
    let dupResponse = {};
    const reqDup = { body: testUser };
    const resDup = {
      status: (code) => {
        dupStatusCode = code;
        return {
          json: (data) => {
            dupResponse = data;
            return data;
          }
        };
      }
    };

    await AuthController.register(reqDup, resDup);
    console.log('   Status Code:', dupStatusCode);
    console.log('   Rejected Cleanly:', dupStatusCode === 400);
    console.log('   Error Message:', dupResponse.error);

    // 3. Test Login with Registered User Credentials
    console.log('\n3. Testing Login with Registered Credentials (POST /api/auth/login)...');
    let loginStatusCode = 200;
    let loginResponse = {};
    const reqLogin = { body: { email: testUser.email, password: testUser.password } };
    const resLogin = {
      status: (code) => {
        loginStatusCode = code;
        return {
          json: (data) => {
            loginResponse = data;
            return data;
          }
        };
      }
    };

    await AuthController.login(reqLogin, resLogin);
    console.log('   Status Code:', loginStatusCode);
    console.log('   Success:', loginResponse.success);
    console.log('   Authenticated User Name:', loginResponse.user?.name);

    if (loginStatusCode !== 200 || !loginResponse.token) {
      throw new Error('Login with registered user failed!');
    }

    console.log('\n====================================================');
    console.log('✅ ALL REGISTRATION & LOGIN SUITE TESTS PASSED!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Test suite error:', err);
    process.exit(1);
  }
}

runRegistrationSuite();
