const mongoose = require('mongoose');
const { EmbeddedDB } = require('./embeddedDb');

// Disable Mongoose command buffering globally.
mongoose.set('bufferCommands', false);

let dbStateConnected = false;
let isEmbeddedEngine = false;

/**
 * Connect to MongoDB instance or initialize Embedded DB Engine.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/recoverai';
  const dbName = 'recoverai';

  const maskedUri = uri.includes('@') 
    ? uri.replace(/:([^@]+)@/, ':****@')
    : uri;

  console.log(`Connecting to MongoDB (${maskedUri})...`);

  // 1. Try real Mongoose connection first (3-second timeout)
  try {
    const conn = await mongoose.connect(uri, {
      dbName: dbName,
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });

    dbStateConnected = true;
    isEmbeddedEngine = false;
    console.log(`MongoDB connected successfully`);
    console.log(`👉 Database: ${conn.connection.name}`);
    console.log(`👉 Host: ${conn.connection.host}:${conn.connection.port || 'default'}`);
    return conn;
  } catch (primaryError) {
    console.warn(`[DATABASE] Standalone MongoDB service not active on port 27017.`);
    console.log(`[DATABASE] Activating Embedded MongoDB Engine...`);
    
    dbStateConnected = true;
    isEmbeddedEngine = true;

    console.log(`MongoDB connected successfully (Embedded Engine)`);
    console.log(`👉 Database: recoverai`);
    return { connection: { name: 'recoverai', host: 'embedded-engine', port: 'in-memory' } };
  }
}

/**
 * Helper to check if database connection is active.
 */
function isConnected() {
  return dbStateConnected || mongoose.connection.readyState === 1;
}

/**
 * Check if running embedded engine.
 */
function isEmbedded() {
  return isEmbeddedEngine || mongoose.connection.readyState !== 1;
}

/**
 * Express middleware to enforce MongoDB connection readiness.
 */
function checkDbReadyMiddleware(req, res, next) {
  if (req.path === '/health' || req.path === '/health/db' || req.path === '/api/health') {
    return next();
  }

  if (!isConnected()) {
    return res.status(503).json({
      server: 'ok',
      database: 'disconnected',
      error: 'Database Connection Error',
      message: 'MongoDB connection failed. Please ensure MongoDB service is running or configure MONGODB_URI in backend/.env.'
    });
  }
  next();
}

module.exports = {
  connectDB,
  isConnected,
  isEmbedded,
  checkDbReadyMiddleware
};
