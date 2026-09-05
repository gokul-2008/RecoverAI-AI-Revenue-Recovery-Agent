
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

async function testMongo() {
  console.log('Testing MongoMemoryServer startup...');
  try {
    const mongo = await MongoMemoryServer.create({
      binary: {
        version: '7.0.14' // Using lightweight 7.0 version
      }
    });
    const uri = mongo.getUri();
    console.log('MongoMemoryServer created URI:', uri);
    await mongoose.connect(uri);
    console.log('Mongoose connected successfully to MongoMemoryServer!');
    await mongoose.disconnect();
    await mongo.stop();
    console.log('MongoMemoryServer stopped cleanly.');
  } catch (err) {
    console.error('MongoMemoryServer error:', err);
  }
}

testMongo();
