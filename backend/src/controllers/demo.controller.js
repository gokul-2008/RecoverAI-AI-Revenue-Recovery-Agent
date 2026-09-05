const Customer = require('../models/customer.model');
const Payment = require('../models/payment.model');
const RecoveryCase = require('../models/case.model');
const AuditLog = require('../models/audit.model');
const RecoveryEngine = require('../services/recovery/engine');
const { isEmbedded } = require('../config/db');
const { EmbeddedDB } = require('../config/embeddedDb');

class DemoController {
  /**
   * Run a demo scenario by its index
   */
  static async runScenario(req, res) {
    const { scenarioId, mode } = req.body;
    const targetMode = mode || 'demo';
    const isDemo = targetMode === 'demo';
    
    if (![1, 2, 3, 4].includes(Number(scenarioId))) {
      return res.status(400).json({ error: 'Invalid scenarioId. Must be 1, 2, 3, or 4.' });
    }

    try {
      let email = `scenario${scenarioId}@recoverai.demo`;
      
      // Clean up previous runs of this scenario
      if (isEmbedded()) {
        const customerExist = EmbeddedDB.findOne('customers', { email });
        if (customerExist) {
          EmbeddedDB.deleteMany('cases', { customerId: customerExist._id });
          EmbeddedDB.deleteMany('payments', { customerId: customerExist._id });
          EmbeddedDB.deleteMany('customers', { email });
        }
      } else {
        const customerExist = await Customer.findOne({ email });
        if (customerExist) {
          const caseIds = await RecoveryCase.find({ customerId: customerExist._id }).select('caseId');
          const caseIdStrings = caseIds.map(c => c.caseId);
          
          await AuditLog.deleteMany({ caseId: { $in: caseIdStrings } });
          await RecoveryCase.deleteMany({ customerId: customerExist._id });
          await Payment.deleteMany({ customerId: customerExist._id });
          await Customer.deleteOne({ email });
        }
      }

      let payload = {};
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const razorpayPaymentId = `pay_demo_${scenarioId}_${randomSuffix}`;

      if (Number(scenarioId) === 1) {
        // Scenario 1: ₹2,499, Temporary bank failure, 8 successful, 1 failure
        const custData = {
          name: 'Ananya Sharma (Demo)',
          email,
          phone: '9876543210',
          totalSuccessfulPayments: 8,
          totalFailedPayments: 1,
          totalSpent: 19992,
          customerRiskScore: 11
        };

        const customer = isEmbedded() 
          ? EmbeddedDB.upsert('customers', custData)
          : await new Customer(custData).save();

        payload = {
          razorpayPaymentId,
          customerDetails: { name: customer.name, email: customer.email, phone: customer.phone },
          amount: 2499,
          currency: 'INR',
          method: 'upi',
          failureReason: 'Temporary bank gateway failure (auth_degraded)'
        };

      } else if (Number(scenarioId) === 2) {
        // Scenario 2: ₹42,000, 4 failures, 0 successful
        const custData = {
          name: 'Rajesh Kumar (Demo)',
          email,
          phone: '9812345678',
          totalSuccessfulPayments: 0,
          totalFailedPayments: 4,
          totalSpent: 0,
          customerRiskScore: 100
        };

        const customer = isEmbedded() 
          ? EmbeddedDB.upsert('customers', custData)
          : await new Customer(custData).save();

        payload = {
          razorpayPaymentId,
          customerDetails: { name: customer.name, email: customer.email, phone: customer.phone },
          amount: 42000,
          currency: 'INR',
          method: 'card',
          failureReason: 'High fraud trigger - card blocked'
        };

      } else if (Number(scenarioId) === 3) {
        // Scenario 3: ₹999, Temporary failure, 5 successful, 0 failures
        const custData = {
          name: 'Vikram Singh (Demo)',
          email,
          phone: '9988776655',
          totalSuccessfulPayments: 5,
          totalFailedPayments: 0,
          totalSpent: 4995,
          customerRiskScore: 0
        };

        const customer = isEmbedded() 
          ? EmbeddedDB.upsert('customers', custData)
          : await new Customer(custData).save();

        payload = {
          razorpayPaymentId,
          customerDetails: { name: customer.name, email: customer.email, phone: customer.phone },
          amount: 999,
          currency: 'INR',
          method: 'netbanking',
          failureReason: 'Bank network timeout'
        };

      } else if (Number(scenarioId) === 4) {
        // Scenario 4: ₹10,000, Multiple previous recovery attempts
        const custData = {
          name: 'Sneha Patel (Demo)',
          email,
          phone: '9123456789',
          totalSuccessfulPayments: 1,
          totalFailedPayments: 3,
          totalSpent: 1000,
          customerRiskScore: 75
        };

        const customer = isEmbedded() 
          ? EmbeddedDB.upsert('customers', custData)
          : await new Customer(custData).save();

        payload = {
          razorpayPaymentId,
          customerDetails: { name: customer.name, email: customer.email, phone: customer.phone },
          amount: 10000,
          currency: 'INR',
          method: 'upi',
          failureReason: 'Repeated insufficient funds',
          initialAttempts: 2
        };
      }

      // Execute Workflow
      const result = await RecoveryEngine.handlePaymentFailure(payload, isDemo);

      return res.status(200).json({
        message: 'Scenario initialized and processed',
        scenarioId,
        ...result
      });

      return res.status(200).json({
        message: 'Scenario initialized and processed',
        scenarioId,
        ...result
      });

    } catch (err) {
      console.error('Error running demo scenario:', err);
      return res.status(500).json({ error: `Demo scenario execution failed: ${err.message}` });
    }
  }

  /**
   * Serve a sandbox mockup checkout page for demo payment links
   */
  /**
   * Serve a sandbox mockup checkout page for demo payment links
   */
  static async getPaymentSimulatorPage(req, res) {
    const { linkId } = req.params;
    let initialAmountText = 'Loading payment details...';
    let caseIdText = '';
    
    try {
      let recoveryCase = null;
      if (isEmbedded()) {
        const list = EmbeddedDB.find('cases');
        recoveryCase = list.find(c => (c.currentAction || '').includes(linkId));
      } else {
        recoveryCase = await RecoveryCase.findOne({ currentAction: new RegExp(linkId) });
      }
      
      if (recoveryCase && recoveryCase.amountAtRisk) {
        initialAmountText = `INR (₹) ${Number(recoveryCase.amountAtRisk).toLocaleString('en-IN')}`;
        caseIdText = recoveryCase.caseId;
      }
    } catch (e) {
      console.error('Error rendering simulator page:', e);
    }
    
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RecoverAI Payments Sandbox</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Outfit', sans-serif; }
        </style>
      </head>
      <body class="bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen p-4">
        <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600"></div>

          <div class="flex items-center space-x-3 mb-6">
            <div class="p-2 bg-cyan-950/50 border border-cyan-800/30 rounded-lg text-cyan-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold tracking-tight">RecoverAI Sandbox</h1>
              <p class="text-xs text-slate-400">Simulated Payment Gateway (Demo Mode)</p>
            </div>
          </div>

          <div class="space-y-4 mb-8 bg-slate-950/60 p-4 border border-slate-800/50 rounded-xl">
            <div class="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
              <span class="text-slate-400">Link ID:</span>
              <span class="font-mono text-cyan-400 font-semibold">${linkId}</span>
            </div>
            ${caseIdText ? `
            <div class="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
              <span class="text-slate-400">Case ID:</span>
              <span class="font-mono text-slate-300 font-semibold">${caseIdText}</span>
            </div>` : ''}
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Payment Amount:</span>
              <span id="payment-amount" class="text-xl font-bold text-slate-100">${initialAmountText}</span>
            </div>
          </div>

          <p class="text-sm text-slate-400 mb-6 leading-relaxed">
            This checkout flow is a simulator to demonstrate autonomous revenue recovery. Completing this transaction triggers the recovery callback and updates the RecoverAI dashboard metrics instantly.
          </p>

          <div class="space-y-3">
            <button id="btn-success" class="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-cyan-900/30 active:scale-95 text-center">
              Authorize Payment (Success)
            </button>
            <button id="btn-fail" class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold py-3 px-4 rounded-xl transition-all active:scale-95 text-center">
              Cancel Transaction (Failed)
            </button>
          </div>
        </div>

        <script>
          const linkId = "${linkId}";
          
          async function fetchAmount() {
            try {
              const res = await fetch('/api/demo/link-info/' + linkId);
              if (!res.ok) {
                const el = document.getElementById('payment-amount');
                if (el && !el.innerText.includes('₹')) {
                  el.innerText = 'Unable to load payment details';
                }
                return;
              }
              const data = await res.json();
              if (data.amount) {
                const el = document.getElementById('payment-amount');
                if (el) {
                  el.innerText = 'INR (₹) ' + Number(data.amount).toLocaleString('en-IN');
                }
              }
            } catch (err) {
              console.error(err);
              const el = document.getElementById('payment-amount');
              if (el && !el.innerText.includes('₹')) {
                el.innerText = 'Unable to load payment details';
              }
            }
          }
          fetchAmount();

          document.getElementById('btn-success').addEventListener('click', async () => {
            document.getElementById('btn-success').disabled = true;
            document.getElementById('btn-success').innerText = 'Processing...';
            try {
              const res = await fetch('/api/demo/pay-complete/' + linkId, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'success' })
              });
              const data = await res.json();
              if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
              }
            } catch(e) {
              alert('Payment processing error');
              document.getElementById('btn-success').disabled = false;
              document.getElementById('btn-success').innerText = 'Authorize Payment (Success)';
            }
          });

          document.getElementById('btn-fail').addEventListener('click', async () => {
            document.getElementById('btn-fail').disabled = true;
            document.getElementById('btn-fail').innerText = 'Cancelling...';
            try {
              const res = await fetch('/api/demo/pay-complete/' + linkId, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'failed' })
              });
              const data = await res.json();
              if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
              } else {
                window.close();
              }
            } catch(e) {
              window.close();
            }
          });
        </script>
      </body>
      </html>
    `);
  }

  static async getLinkInfo(req, res) {
    const { linkId } = req.params;
    try {
      let recoveryCase = null;
      if (isEmbedded()) {
        const list = EmbeddedDB.find('cases');
        recoveryCase = list.find(c => (c.currentAction || '').includes(linkId));
      } else {
        recoveryCase = await RecoveryCase.findOne({ currentAction: new RegExp(linkId) });
      }

      if (!recoveryCase) {
        return res.status(404).json({ error: 'Mock link not found' });
      }

      return res.status(200).json({
        amount: recoveryCase.amountAtRisk,
        caseId: recoveryCase.caseId,
        status: recoveryCase.status
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async completeSimulatedPayment(req, res) {
    const { linkId } = req.params;
    const { status } = req.body;
    try {
      let recoveryCase = null;
      if (isEmbedded()) {
        const list = EmbeddedDB.find('cases');
        recoveryCase = list.find(c => (c.currentAction || '').includes(linkId));
      } else {
        recoveryCase = await RecoveryCase.findOne({ currentAction: new RegExp(linkId) });
      }

      if (!recoveryCase) {
        return res.status(404).json({ error: 'Mock link case not found' });
      }

      if (status === 'success') {
        await RecoveryEngine.handleRecoverySuccess(recoveryCase.caseId, recoveryCase.amountAtRisk, true);
        const redirectUrl = `http://localhost:5173/cases/${recoveryCase.caseId}?payment=success`;
        return res.status(200).json({
          message: 'Payment simulated successfully',
          redirectUrl
        });
      } else {
        const redirectUrl = `http://localhost:5173/cases/${recoveryCase.caseId}?payment=cancelled`;
        return res.status(200).json({
          message: 'Payment simulation cancelled',
          redirectUrl
        });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = DemoController;
