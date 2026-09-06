const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const { checkDbReadyMiddleware, isConnected } = require('./config/db');
const apiRoutes = require('./routes/api.routes');

const app = express();

// Security HTTP headers
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for local sandbox scripts
}));

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature']
}));

// Middleware to parse JSON and preserve raw body for Razorpay webhook verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.use(express.urlencoded({ extended: true }));

// Health check endpoints matching requirement #9
app.get('/health', (req, res) => {
  const dbState = isConnected();
  res.status(200).json({
    server: 'ok',
    database: dbState ? 'connected' : 'disconnected'
  });
});

app.get('/api/health', (req, res) => {
  const dbState = isConnected();
  res.status(200).json({
    server: 'ok',
    database: dbState ? 'connected' : 'disconnected'
  });
});

app.get('/api/health/db', (req, res) => {
  const dbState = isConnected();
  res.status(200).json({
    server: 'ok',
    database: dbState ? 'connected' : 'disconnected',
    state: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    host: mongoose.connection.host || 'none',
    name: mongoose.connection.name || 'none'
  });
});

// Enforce database connection check before operational API routes
app.use('/api', checkDbReadyMiddleware, apiRoutes);

// Serve static frontend assets in production environment if build dist exists
const path = require('path');
const fs = require('fs');
const frontendDistPath = path.join(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendDistPath)) {
  console.log(`[PRODUCTION] Serving static frontend files from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[UNHANDLED EXPRESS ERROR]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

module.exports = app;
