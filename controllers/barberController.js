// controllers/barberController.js
const Barber = require('../models/Barber');
const Shop = require('../models/Shop');

exports.createBarber = async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    const { name, services, avgDuration } = req.body;
    const barber = new Barber({ shop: shop._id, name, services, avgDuration });
    await barber.save();
    res.status(201).json(barber);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBarbers = async (req, res) => {
  const { shopId } = req.params;
  const barbers = await Barber.find({ shop: shopId });
  res.json(barbers);
};

exports.updateBarber = async (req, res) => {
  const { barberId } = req.params;
  const updated = await Barber.findByIdAndUpdate(barberId, req.body, { new: true });
  res.json(updated);
};
