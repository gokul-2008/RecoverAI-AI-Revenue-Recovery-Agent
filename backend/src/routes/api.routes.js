const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/auth.controller');
const DashboardController = require('../controllers/dashboard.controller');
const CasesController = require('../controllers/cases.controller');
const WebhookController = require('../controllers/webhook.controller');
const DemoController = require('../controllers/demo.controller');
const EvaluationController = require('../controllers/evaluation.controller');

const Customer = require('../models/customer.model');
const Payment = require('../models/payment.model');
const AuditLog = require('../models/audit.model');

const { isEmbedded } = require('../config/db');
const { EmbeddedDB } = require('../config/embeddedDb');
const { requireAuth } = require('../middleware/auth.middleware');

// Public Auth routes
router.post('/auth/login', AuthController.login);
router.post('/login', AuthController.login);
router.post('/auth/register', AuthController.register);
router.post('/register', AuthController.register);
router.get('/auth/me', requireAuth, AuthController.getMe);
router.get('/me', requireAuth, AuthController.getMe);

// Razorpay Webhooks (Public callback)
router.post('/webhooks/razorpay', WebhookController.receiveWebhook);

// Demo Sandbox Checkout Simulator (Public simulator UI)
router.get('/demo/pay-simulate/:linkId', DemoController.getPaymentSimulatorPage);
router.get('/demo/link-info/:linkId', DemoController.getLinkInfo);
router.post('/demo/pay-complete/:linkId', DemoController.completeSimulatedPayment);

// Protected Recovery Agent Routes
router.use('/dashboard', requireAuth);
router.use('/recovery-cases', requireAuth);
router.use('/demo/run', requireAuth);
router.use('/evaluation', requireAuth);
router.use('/customers', requireAuth);
router.use('/payments', requireAuth);
router.use('/audits', requireAuth);

// Dashboard routes
router.get('/dashboard/stats', DashboardController.getStats);

// Recovery Cases routes
router.get('/recovery-cases', CasesController.getCases);
router.get('/recovery-cases/:id', CasesController.getCaseById);
router.get('/recovery-cases/:id/audit', CasesController.getCaseAudit);
router.post('/recovery-cases/:id/execute', CasesController.executeAction);
router.post('/recovery-cases/:id/escalate', CasesController.escalateCase);

// Demo scenarios execution
router.post('/demo/run', DemoController.runScenario);

// Batch Evaluation Results
router.get('/evaluation/results', EvaluationController.getResults);

// Customers & Payments tables data
router.get('/customers', async (req, res) => {
  try {
    if (isEmbedded()) {
      const customers = EmbeddedDB.find('customers');
      return res.status(200).json(customers);
    }
    const customers = await Customer.find().sort({ updatedAt: -1 });
    res.status(200).json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/payments', async (req, res) => {
  try {
    const { mode } = req.query;
    if (isEmbedded()) {
      let payments = EmbeddedDB.find('payments');
      if (mode && mode !== 'all') {
        payments = payments.filter(p => p.mode === mode || !p.mode);
      }
      const populated = payments.map(p => {
        const cust = EmbeddedDB.findOne('customers', { _id: p.customerId });
        return {
          ...p,
          customerId: cust ? { name: cust.name, email: cust.email } : null
        };
      });
      return res.status(200).json(populated);
    }
    const filter = (mode && mode !== 'all') ? { mode } : {};
    const payments = await Payment.find(filter).populate('customerId', 'name email').sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/audits', async (req, res) => {
  try {
    if (isEmbedded()) {
      const audits = EmbeddedDB.find('audits').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json(audits.slice(0, 100));
    }
    const audits = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json(audits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
