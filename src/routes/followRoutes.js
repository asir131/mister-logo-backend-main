const express = require('express');
const authenticate = require('../middleware/auth');
const { followUser, unfollowUser } = require('../controllers/followController');

const router = express.Router();

router.post('/', authenticate, followUser);

router.delete('/:userId', authenticate, unfollowUser);

module.exports = router;
