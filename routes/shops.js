// routes/shops.js
const express = require('express');
const router = express.Router();
const { createShop, updateShop } = require('../controllers/shopController');
const auth = require("../middleware/auth");

router.post('/', auth, createShop);
router.put('/update/:slugOrId', auth, updateShop);
router.get('/:slugOrId', async (req, res) => {
  const Shop = require('../models/Shop');
  const Barber = require('../models/Barber'); // 1. Import the Barber model
  const { slugOrId } = req.params;

  try {
    // 2. Find the shop
    let shop = await Shop.findOne({ slug: slugOrId }).lean();
    if (!shop && /^[0-9a-fA-F]{24}$/.test(slugOrId)) { // Validating ObjectId format
      shop = await Shop.findById(slugOrId).lean();
    }

    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    // 3. Find all active barbers for this specific shop
    const barbers = await Barber.find({ shop: shop._id, status: 'active' }).lean();

    // 4. Send back the combined data
    res.json({
      ...shop,
      barbers: barbers // This adds the array your frontend is looking for
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
