const express = require('express');
const router = express.Router();
const {
  viewQueue,
  joinQueue,
  leaveQueue,
  getMyQueue
} = require('../controllers/queueController');

// PUBLIC: customer joins via shop slug
router.post('/shops/:slug/queue/join', joinQueue);

router.get('/queue/me',  getMyQueue);
// PUBLIC: customer views their queue status
router.get('/queue/:barberId', viewQueue);

// PUBLIC: customer leaves queue
router.post('/queue/leave', leaveQueue);


module.exports = router;
