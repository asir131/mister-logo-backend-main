const express = require('express');
const { lateWebhook } = require('../controllers/webhookController');
const { handleStripeWebhook } = require('../controllers/ublastOfferController');

const router = express.Router();

router.post('/late', lateWebhook);
router.post('/stripe', handleStripeWebhook);

module.exports = router;
