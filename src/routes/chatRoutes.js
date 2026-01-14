const express = require('express');
const multer = require('multer');

const authenticate = require('../middleware/auth');
const {
  getChatList,
  getConversation,
  sendMessage,
  markConversationRead,
} = require('../controllers/chatController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

const router = express.Router();

router.get('/', authenticate, getChatList);
router.get('/:userId/messages', authenticate, getConversation);
router.post('/:userId/messages', authenticate, upload.single('file'), sendMessage);
router.post('/:userId/read', authenticate, markConversationRead);

module.exports = router;
