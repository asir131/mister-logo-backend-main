const mongoose = require('mongoose');

const ublastOfferSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ublastId: { type: mongoose.Schema.Types.ObjectId, ref: 'UBlast', required: true, index: true },
    priceCents: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled', 'expired'],
      default: 'pending',
      index: true,
    },
    paymentIntentId: { type: String },
    paidAt: { type: Date },
    cancelledAt: { type: Date },
    expiresAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

ublastOfferSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('UblastOffer', ublastOfferSchema);
