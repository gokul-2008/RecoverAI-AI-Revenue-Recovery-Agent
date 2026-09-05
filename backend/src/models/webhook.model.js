const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true }, // Razorpay Webhook Event ID (for idempotency)
  eventType: { type: String, required: true }, // e.g. payment.failed, payment_link.paid
  payload: { type: mongoose.Schema.Types.Mixed },
  processed: { type: Boolean, default: false },
  receivedAt: { type: Date, default: Date.now }
}, { timestamps: true, bufferCommands: false });

module.exports = mongoose.model('WebhookEvent', webhookSchema);
