const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authenticate = require('../middlewares/authMiddleware');

router.post('/send', authenticate, messageController.sendBatch);
router.get('/connect', authenticate, messageController.connect);
router.get('/status', authenticate, messageController.status);

module.exports = router;
