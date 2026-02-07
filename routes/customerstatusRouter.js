const express = require('express');
const router = express.Router();
const barberQueueController = require('../controllers/customerstatusController');
const requireAuth = require('../middleware/barberauth'); // barber auth

router.use(requireAuth);

router.patch('/queue/:customerId/start', barberQueueController.startCustomer);
router.patch('/queue/:customerId/complete', barberQueueController.completeCustomer);
router.patch('/queue/:customerId/no-show', barberQueueController.noShowCustomer);

module.exports = router;
