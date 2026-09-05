const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  amountAtRisk: { type: Number, required: true },
  failureReason: { type: String },
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  recoveryProbability: { type: Number, default: 0.0 },
  rootCause: { type: String },
  recommendedAction: { type: String },
  currentAction: { type: String },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 2 },
  status: { type: String, enum: ['active', 'recovered', 'escalated', 'stopped'], default: 'active' },
  recoveredAmount: { type: Number, default: 0 },
  aiProvider: { type: String, enum: ['GEMINI', 'RULE_BASED'], default: 'RULE_BASED' },
  mode: { type: String, enum: ['demo', 'test'], default: 'test' }
}, { timestamps: true, bufferCommands: false });

module.exports = mongoose.model('RecoveryCase', caseSchema);
