const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  totalSuccessfulPayments: { type: Number, default: 0 },
  totalFailedPayments: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastPaymentDate: { type: Date },
  customerRiskScore: { type: Number, default: 0 } // 0 (Safe) to 100 (Extremely Risky)
}, { timestamps: true, bufferCommands: false });

module.exports = mongoose.model('Customer', customerSchema);
