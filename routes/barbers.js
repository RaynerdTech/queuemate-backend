const express = require('express');
const router = express.Router();
const barberController = require('../controllers/barberController');
const auth = require('../middleware/auth');

// NO shopId anywhere 👇
router.post('/barbers', auth, barberController.createBarber);
router.get('/barbers', auth, barberController.getBarbers);
router.patch('/barbers/:barberId', auth, barberController.updateBarber);

module.exports = router;
