const mongoose = require('mongoose');
const { EmbeddedDB } = require('./embeddedDb');

// Disable Mongoose command buffering globally.
mongoose.set('bufferCommands', false);

let dbStateConnected = false;
let isEmbeddedEngine = false;

function sanitizeMongoUri(rawUri) {
  if (!rawUri) return rawUri;
  try {
    const parts = rawUri.split('://');
    if (parts.length === 2 && parts[1].includes('@')) {
      const atIndex = parts[1].lastIndexOf('@');
      const creds = parts[1].substring(0, atIndex);
      const hostPath = parts[1].substring(atIndex + 1);
      
      const colonIndex = creds.indexOf(':');
      if (colonIndex !== -1) {
        const user = creds.substring(0, colonIndex);
        const pass = creds.substring(colonIndex + 1);
        const encodedPass = encodeURIComponent(decodeURIComponent(pass));
        return `${parts[0]}://${user}:${encodedPass}@${hostPath}`;
      }
    }
  } catch (e) {
    // Return original rawUri on error
  }
  return rawUri;
}

/**
 * Connect to MongoDB instance or initialize Embedded DB Engine.
 */
async function connectDB() {
  const isProd = process.env.NODE_ENV === 'production';
  const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const uri = sanitizeMongoUri(rawUri);

  if (isProd) {
    if (!uri) {
      console.error('\n❌ [FATAL CONFIGURATION ERROR] MONGODB_URI or MONGO_URI environment variable is missing.');
      console.error('👉 Embedded MongoDB fallback is disabled in production mode.');
      console.error('👉 Please configure MONGODB_URI in your Render environment variables to connect to MongoDB Atlas.\n');
      throw new Error('MONGODB_URI environment variable is required for production deployment on Render.');
    }

    const maskedUri = uri.includes('@') 
      ? uri.replace(/:([^@]+)@/, ':****@')
      : uri;

    console.log(`[PRODUCTION] Connecting to MongoDB Atlas (${maskedUri})...`);

    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });

      dbStateConnected = true;
      isEmbeddedEngine = false;
      console.log(`[PRODUCTION] MongoDB connected successfully to MongoDB Atlas`);
      console.log(`👉 Database: ${conn.connection.name}`);
      console.log(`👉 Host: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.error(`❌ [PRODUCTION DB ERROR] Failed to connect to MongoDB Atlas: ${err.message}`);
      dbStateConnected = false;
      isEmbeddedEngine = false;
      throw err;
    }
  }

  // Development Mode (Local development or fallback)
  const devUri = uri || 'mongodb://127.0.0.1:27017/recoverai';
  const dbName = 'recoverai';

  const maskedUri = devUri.includes('@') 
    ? devUri.replace(/:([^@]+)@/, ':****@')
    : devUri;

  console.log(`[DEVELOPMENT] Connecting to MongoDB (${maskedUri})...`);

  try {
    const conn = await mongoose.connect(devUri, {
      dbName: dbName,
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });

    dbStateConnected = true;
    isEmbeddedEngine = false;
    console.log(`[DEVELOPMENT] MongoDB connected successfully`);
    console.log(`👉 Database: ${conn.connection.name}`);
    console.log(`👉 Host: ${conn.connection.host}:${conn.connection.port || 'default'}`);
    return conn;
  } catch (primaryError) {
    console.warn(`[DEVELOPMENT] Standalone MongoDB service not active on local port 27017.`);
    console.log(`[DEVELOPMENT] Activating Local Embedded MongoDB Engine...`);
    
    dbStateConnected = true;
    isEmbeddedEngine = true;

    console.log(`[DEVELOPMENT] MongoDB connected successfully (Embedded Engine)`);
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
 * Check if running embedded engine (Disabled in production mode).
 */
function isEmbedded() {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
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
