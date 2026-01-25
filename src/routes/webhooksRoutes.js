const express = require('express');
const { lateWebhook } = require('../controllers/webhookController');

const router = express.Router();

router.post('/late', lateWebhook);

module.exports = router;
