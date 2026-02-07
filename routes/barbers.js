const express = require('express');
const router = express.Router();
const barberController = require('../controllers/barberController');
const auth = require('../middleware/auth');
const barberAuth = require("../middleware/barberauth");

// NO shopId anywhere 👇
router.post('/', auth, barberController.createBarber);
router.get('/', auth, barberController.getBarbers);
router.get('/profile', barberAuth, barberController.getBarberProfile);
router.patch('/:barberId', auth, barberController.updateBarber);
router.delete('/:barberId', auth, barberController.deleteBarber);
router.post('/loginbarber', barberController.accessBarberDashboard); 

module.exports = router;
