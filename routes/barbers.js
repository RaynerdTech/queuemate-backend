// routes/barbers.js
const express = require('express');
const router = express.Router();
const barberController = require('../controllers/barberController');

router.post('/:shopId/barbers', barberController.createBarber);
router.get('/:shopId/barbers', barberController.getBarbers);
router.patch('/:shopId/barbers/:barberId', barberController.updateBarber);

module.exports = router;
