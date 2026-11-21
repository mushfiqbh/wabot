const express = require('express');
const router = express.Router();
const bkashController = require('../controllers/bkashController');

// bKash Payment Routes
router.post('/api/bkash/make-payment', bkashController.makePayment);
router.get('/api/bkash/callback', bkashController.callback);

module.exports = router;