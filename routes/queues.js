// routes/queues.js
const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');

router.post('/:shopId/queues', queueController.joinQueue);
router.get('/:shopId/queues', queueController.getQueue);
router.patch('/:shopId/queues/:customerId', queueController.updateCustomerStatus);

module.exports = router;
