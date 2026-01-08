const express = require('express');

const authenticate = require('../middleware/auth');
const { getFeed } = require('../controllers/feedController');

const router = express.Router();

router.get('/', authenticate, getFeed);

module.exports = router;
