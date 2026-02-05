const express = require('express');

const authenticate = require('../middleware/auth');
const {
  listMyOffers,
  createPaymentIntent,
  cancelOffer,
} = require('../controllers/ublastOfferController');

const router = express.Router();

router.get('/', authenticate, listMyOffers);
router.post('/:offerId/pay', authenticate, createPaymentIntent);
router.post('/:offerId/cancel', authenticate, cancelOffer);

module.exports = router;
