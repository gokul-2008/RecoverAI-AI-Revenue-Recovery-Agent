const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  caseId: { type: String, required: true }, // refers to RecoveryCase.caseId
  actionType: { type: String, required: true }, // RETRY_PAYMENT, CREATE_PAYMENT_LINK, SEND_REMINDER, ESCALATE_TO_MERCHANT, STOP
  reason: { type: String },
  aiConfidence: { type: Number, default: 0.0 },
  status: { type: String, enum: ['pending', 'success', 'failed', 'rejected'], default: 'pending' },
  result: { type: mongoose.Schema.Types.Mixed } // contains transaction link IDs, metadata, or error details
}, { timestamps: true, bufferCommands: false });

module.exports = mongoose.model('RecoveryAction', actionSchema);
