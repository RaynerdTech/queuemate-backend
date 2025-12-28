// controllers/queueController.js
const Customer = require('../models/Customer');
const Barber = require('../models/Barber');
const Shop = require('../models/Shop');

exports.joinQueue = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { name, phone, barberId, serviceName, serviceDuration, note } = req.body;

    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    // If barberId is provided, check if barber exists
    if (barberId) {
      const barberExists = await Barber.findById(barberId);
      if (!barberExists) {
        return res.status(400).json({ message: 'Barber not found' });
      }
    }

    // Compute position (per barber or global)
    let position = 1;
    if (barberId) {
      const count = await Customer.countDocuments({
        shop: shopId,
        barber: barberId,
        status: 'waiting'
      });
      position = count + 1;
    } else {
      const count = await Customer.countDocuments({
        shop: shopId,
        status: 'waiting'
      });
      position = count + 1;
    }

    const customer = new Customer({
      shop: shopId,
      barber: barberId || null,
      name,
      phone,
      serviceName,
      serviceDuration,
      position,
      note
    });

    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getQueue = async (req, res) => {
  try {
    const { shopId } = req.params;

    const customers = await Customer.find({
      shop: shopId,
      status: { $in: ['waiting', 'in_service'] }
    })
    .populate('barber', 'name') // Populate barber field with only the name
    .sort('createdAt');

    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCustomerStatus = async (req, res) => {
  const { customerId } = req.params;
  const updated = await Customer.findByIdAndUpdate(
    customerId,
    req.body,
    { new: true }
  );
  res.json(updated);
};
