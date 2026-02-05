const mongoose = require('mongoose');
const Stripe = require('stripe');

const UblastOffer = require('../models/UblastOffer');
const UBlast = require('../models/UBlast');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

async function listMyOffers(req, res) {
  const userId = req.user.id;
  const offers = await UblastOffer.find({ userId })
    .sort({ createdAt: -1 })
    .populate('ublastId', 'title content mediaUrl mediaType rewardLabel rewardType')
    .lean();
  return res.status(200).json({ offers });
}

async function createPaymentIntent(req, res) {
  const { offerId } = req.params;
  if (!mongoose.isValidObjectId(offerId)) {
    return res.status(400).json({ error: 'Invalid offer id.' });
  }
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured.' });
  }

  const offer = await UblastOffer.findOne({ _id: offerId, userId: req.user.id });
  if (!offer) {
    return res.status(404).json({ error: 'Offer not found.' });
  }
  if (offer.status !== 'pending') {
    return res.status(400).json({ error: 'Offer is not payable.' });
  }
  if (offer.expiresAt && offer.expiresAt.getTime() < Date.now()) {
    offer.status = 'expired';
    await offer.save();
    return res.status(400).json({ error: 'Offer expired.' });
  }

  const intent = await stripe.paymentIntents.create({
    amount: offer.priceCents,
    currency: offer.currency || 'usd',
    metadata: { offerId: offer._id.toString(), userId: offer.userId.toString() },
  });

  offer.paymentIntentId = intent.id;
  await offer.save();

  return res.status(200).json({
    clientSecret: intent.client_secret,
  });
}

async function cancelOffer(req, res) {
  const { offerId } = req.params;
  if (!mongoose.isValidObjectId(offerId)) {
    return res.status(400).json({ error: 'Invalid offer id.' });
  }

  const offer = await UblastOffer.findOne({ _id: offerId, userId: req.user.id });
  if (!offer) {
    return res.status(404).json({ error: 'Offer not found.' });
  }
  if (offer.status !== 'pending') {
    return res.status(400).json({ error: 'Only pending offers can be cancelled.' });
  }
  offer.status = 'cancelled';
  offer.cancelledAt = new Date();
  await offer.save();

  return res.status(200).json({ offerId: offer._id, status: offer.status });
}

async function handleStripeWebhook(req, res) {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured.' });
  }
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const offerId = intent.metadata?.offerId;
    if (offerId && mongoose.isValidObjectId(offerId)) {
      await UblastOffer.updateOne(
        { _id: offerId },
        { $set: { status: 'paid', paidAt: new Date() } },
      );
    }
  }

  if (event.type === 'payment_intent.canceled') {
    const intent = event.data.object;
    const offerId = intent.metadata?.offerId;
    if (offerId && mongoose.isValidObjectId(offerId)) {
      await UblastOffer.updateOne(
        { _id: offerId },
        { $set: { status: 'cancelled', cancelledAt: new Date() } },
      );
    }
  }

  return res.status(200).json({ received: true });
}

module.exports = {
  listMyOffers,
  createPaymentIntent,
  cancelOffer,
  handleStripeWebhook,
};
