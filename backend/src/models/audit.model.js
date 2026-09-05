const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  caseId: { type: String }, // can be null for system-wide events
  eventType: { type: String, required: true }, // PAYMENT_FAILED, CASE_CREATED, AI_DIAGNOSIS, POLICY_VALIDATED, ACTION_EXECUTED, WEBHOOK_RECEIVED, etc.
  message: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true, bufferCommands: false });

module.exports = mongoose.model('AuditLog', auditSchema);
