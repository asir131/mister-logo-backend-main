const express = require('express');

const authenticate = require('../middleware/auth');
const { getUserOverview, getUserPosts } = require('../controllers/userController');

const router = express.Router();

router.get('/:userId/overview', authenticate, getUserOverview);
router.get('/:userId/posts', authenticate, getUserPosts);

module.exports = router;
