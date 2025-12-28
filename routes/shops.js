// routes/shops.js
const express = require('express');
const router = express.Router();
const { createShop, updateShop } = require('../controllers/shopController');
const auth = require("../middleware/auth");

router.post('/', auth, createShop);
router.put('/update/:slugOrId', auth, updateShop);
router.get('/:slugOrId', async (req, res) => {
  const Shop = require('../models/Shop');
  const { slugOrId } = req.params;
  let shop = await Shop.findOne({ slug: slugOrId });
  if (!shop && /^\w+$/.test(slugOrId)) {
    shop = await Shop.findById(slugOrId).catch(()=>null);
  }
  if (!shop) return res.status(404).json({ message:'Shop not found' });
  res.json(shop);
});

module.exports = router;
