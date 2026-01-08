const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');

const authenticate = require('../middleware/auth');
const { createPost, deletePost } = require('../controllers/postController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    const isAudio = file.mimetype.startsWith('audio/');
    if (!isImage && !isVideo && !isAudio) {
      const err = new Error('Only image, video, or audio uploads are allowed.');
      err.status = 400;
      return cb(err);
    }
    return cb(null, true);
  },
});

const router = express.Router();

router.post(
  '/',
  authenticate,
  upload.single('media'),
  [
    body('description').optional({ nullable: true }).trim(),
    body('shareToFacebook').optional({ nullable: true }).isBoolean().toBoolean(),
    body('shareToInstagram').optional({ nullable: true }).isBoolean().toBoolean(),
  ],
  createPost,
);

router.delete('/:postId', authenticate, deletePost);

module.exports = router;
