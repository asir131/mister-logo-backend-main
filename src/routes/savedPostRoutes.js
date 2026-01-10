const express = require('express');

const authenticate = require('../middleware/auth');
const {
  savePost,
  unsavePost,
  getSavedPosts,
} = require('../controllers/savedPostController');

const router = express.Router();

router.get('/', authenticate, getSavedPosts);

router.post('/', authenticate, savePost);

router.delete('/:postId', authenticate, unsavePost);

module.exports = router;
