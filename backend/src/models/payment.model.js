const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  razorpayPaymentId: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  amount: { type: Number, required: true }, // Store in Rupees for easier reading in UI, or store in paise. We will store in Rupees.
  currency: { type: String, default: 'INR' },
  status: { type: String, required: true }, // failed, captured, authorized, etc.
  method: { type: String }, // card, upi, netbanking, etc.
  failureReason: { type: String },
  mode: { type: String, enum: ['demo', 'test'], default: 'test' }
}, { timestamps: true, bufferCommands: false });

module.exports = mongoose.model('Payment', paymentSchema);
