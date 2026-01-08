const express = require('express');
const authenticate = require('../middleware/auth');
const { likePost, unlikePost } = require('../controllers/likeController');

const router = express.Router();

router.post('/', authenticate, likePost);

router.delete('/:postId', authenticate, unlikePost);

module.exports = router;
