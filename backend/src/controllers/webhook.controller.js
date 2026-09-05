const WebhookEvent = require('../models/webhook.model');
const RecoveryCase = require('../models/case.model');
const RecoveryEngine = require('../services/recovery/engine');
const RazorpayService = require('../services/razorpay/razorpay.service');
const { isEmbedded } = require('../config/db');
const { EmbeddedDB } = require('../config/embeddedDb');

class WebhookController {
  /**
   * Main webhook receiver for Razorpay events
   */
  static async receiveWebhook(req, res) {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    console.log('[WEBHOOK] Razorpay webhook event received.');

    // 1. Verify webhook signature
    const isValid = RazorpayService.verifyWebhookSignature(
      rawBody,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.warn('[WEBHOOK] Invalid webhook signature detected. Rejecting.');
      await RecoveryEngine.logAudit(null, 'INVALID_WEBHOOK_SIGNATURE', 'Received webhook request with invalid signature header.');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const payload = req.body;
    const eventId = payload.id || `evt_${Math.random().toString(36).substring(2, 11)}`;
    const eventType = payload.event;

    if (!eventType) {
      return res.status(400).json({ error: 'Missing event type' });
    }

    try {
      // 2. Check Idempotency: Has this event already been processed?
      let existingEvent = isEmbedded()
        ? EmbeddedDB.findOne('webhooks', { eventId })
        : await WebhookEvent.findOne({ eventId });

      if (existingEvent) {
        console.log(`[WEBHOOK] Event ID ${eventId} already processed. Skipping.`);
        return res.status(200).json({ status: 'ignored', message: 'Event already processed' });
      }

      // 3. Save event to DB
      if (isEmbedded()) {
        EmbeddedDB.upsert('webhooks', {
          eventId,
          eventType,
          payload,
          processed: true
        });
      } else {
        const webhookEvent = new WebhookEvent({
          eventId,
          eventType,
          payload,
          processed: true
        });
        await webhookEvent.save();
      }

      console.log(`[WEBHOOK] Processing event ${eventType} (${eventId})`);

      // 4. Handle events
      if (eventType === 'payment.failed') {
        const paymentObj = payload.payload?.payment?.entity || {};
        
        const razorpayPaymentId = paymentObj.id || `pay_${Math.random().toString(36).substring(2, 11)}`;
        const amount = paymentObj.amount ? paymentObj.amount / 100 : 2499; // Convert paise to INR
        const currency = paymentObj.currency || 'INR';
        const method = paymentObj.method || 'upi';
        const failureReason = paymentObj.error_description || paymentObj.error_code || 'Payment failed';

        const customerDetails = {
          name: paymentObj.notes?.customer_name || 'Walk-in Customer',
          email: paymentObj.email || `customer_${razorpayPaymentId}@recoverai.demo`,
          phone: paymentObj.contact || '9876543210'
        };

        // Trigger Recovery engine in Test Mode
        await RecoveryEngine.handlePaymentFailure({
          razorpayPaymentId,
          customerDetails,
          amount,
          currency,
          method,
          failureReason
        }, false);

      } else if (eventType === 'payment_link.paid') {
        const linkObj = payload.payload?.payment_link?.entity || {};
        const paymentObj = payload.payload?.payment?.entity || {};
        
        const caseId = linkObj.notes?.caseId || (linkObj.description && linkObj.description.includes('Case') ? linkObj.description.split('Case ')[1] : null);
        const amount = paymentObj.amount ? paymentObj.amount / 100 : (linkObj.amount ? linkObj.amount / 100 : 2499);

        if (caseId) {
          await RecoveryEngine.handleRecoverySuccess(caseId, amount, false);
        } else {
          console.warn(`[WEBHOOK] No caseId found in notes for payment_link.paid event ${eventId}. Attempting lookup.`);
          let activeCase = isEmbedded()
            ? EmbeddedDB.find('cases', { status: 'active' })[0]
            : await RecoveryCase.findOne({ amountAtRisk: amount, status: 'active' }).sort({ createdAt: -1 });

          if (activeCase) {
            await RecoveryEngine.handleRecoverySuccess(activeCase.caseId, amount, false);
          } else {
            console.error(`[WEBHOOK] Could not associate payment link to any active recovery case.`);
          }
        }

      } else if (eventType === 'payment.captured') {
        const paymentObj = payload.payload?.payment?.entity || {};
        const amount = paymentObj.amount ? paymentObj.amount / 100 : 2499;
        
        const caseId = paymentObj.notes?.caseId;
        if (caseId) {
          await RecoveryEngine.handleRecoverySuccess(caseId, amount, false);
        } else {
          let activeCase = isEmbedded()
            ? EmbeddedDB.find('cases', { status: 'active' })[0]
            : await RecoveryCase.findOne({ amountAtRisk: amount, status: 'active' }).sort({ createdAt: -1 });

          if (activeCase) {
            await RecoveryEngine.handleRecoverySuccess(activeCase.caseId, amount, false);
          }
        }
      }

      return res.status(200).json({ status: 'success', eventId });
    } catch (err) {
      console.error('[WEBHOOK ERROR] Failed to process webhook event:', err);
      return res.status(500).json({ error: 'Internal server error processing webhook' });
    }
  }
}

module.exports = WebhookController;
