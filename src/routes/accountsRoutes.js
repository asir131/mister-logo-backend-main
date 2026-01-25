const express = require('express');
const authenticate = require('../middleware/auth');
const {
  connectLate,
  lateCallback,
  listAccounts,
  disconnectAccount,
} = require('../controllers/accountsController');

const router = express.Router();

router.post('/connect-late', authenticate, connectLate);
router.get('/late-callback', lateCallback);
router.get('/', authenticate, listAccounts);
router.delete('/:platform', authenticate, disconnectAccount);

module.exports = router;
