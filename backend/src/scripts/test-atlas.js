const mongoose = require('mongoose');

const uri = "mongodb+srv://buildathon_user:BuildathonPass2026@cluster0.o3x4h.mongodb.net/recoverai?retryWrites=true&w=majority";

async function test() {
  console.log('Connecting to MongoDB Atlas cloud database...');
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('====================================================');
    console.log('✅ ATLAS CONNECTION SUCCESSFUL!');
    console.log('👉 Host:', conn.connection.host);
    console.log('👉 Database:', conn.connection.name);
    console.log('====================================================');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ ATLAS CONNECTION FAILED:', err.message);
    process.exit(1);
  }
}

test();
