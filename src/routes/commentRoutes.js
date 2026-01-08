const express = require('express');
const authenticate = require('../middleware/auth');
const { createComment, getComments } = require('../controllers/commentController');

const router = express.Router();

router.get('/', authenticate, getComments);

router.post('/', authenticate, createComment);

module.exports = router;
