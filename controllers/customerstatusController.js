const Customer = require('../models/Customer');
const { getQueueForBarber } = require('../services/queueService');

/**
 * START SERVICE
 */
exports.startCustomer = async (req, res) => {
  try {
    // FIX: Get barberId from either .id or .barberId
    const barberId = req.barber.id || req.barber.barberId;
    const { customerId } = req.params;

    // Validate we have a barberId
    if (!barberId) {
      return res.status(400).json({
        message: 'Barber ID not found in token'
      });
    }

    // 1️⃣ Check if another customer is already in service
    const active = await Customer.findOne({
      barber: barberId,
      status: 'in_service'
    });

    if (active) {
      return res.status(400).json({
        message: 'Another customer is already being served'
      });
    }

    // 2️⃣ Find the waiting customer
    const customer = await Customer.findOne({
      _id: customerId,
      barber: barberId,
      status: 'waiting'
    });

    if (!customer) {
      return res
        .status(404)
        .json({ message: 'Customer not found or not waiting' });
    }

    // 3️⃣ Start service
    customer.status = 'in_service';
    customer.startedAt = new Date();
    await customer.save();

    // 4️⃣ Return updated queue
    const queueState = await getQueueForBarber(barberId);

    res.json({
      message: 'Service started',
      queueState
    });

  } catch (err) {
    console.error('Start error:', err);
    res.status(500).json({ 
      message: 'Server error starting service',
      error: err.message 
    });
  }
};



/**
 * COMPLETE SERVICE
 */
exports.completeCustomer = async (req, res) => {
  try {
    // FIX: Use barber.id OR barber.barberId
    const barberId = req.barber.id || req.barber.barberId;
    const { customerId } = req.params;

    // Validate barberId exists
    if (!barberId) {
      return res.status(400).json({
        message: 'Barber ID not found in token'
      });
    }

    const customer = await Customer.findOne({
      _id: customerId,
      barber: barberId,
      status: 'in_service' // Changed from 'in_progress' to match your start function
    });

    if (!customer) {
      return res.status(404).json({
        message: 'Customer not found or not in service'
      });
    }

    customer.status = 'completed';
    customer.completedAt = new Date();
    await customer.save();

    const queueState = await getQueueForBarber(barberId);

    res.json({
      message: 'Service completed',
      queueState
    });

  } catch (err) {
    console.error('Complete error:', err);
    res.status(500).json({ 
      message: 'Server error completing service',
      error: err.message 
    });
  }
};


/**
 * NO SHOW
 */
exports.noShowCustomer = async (req, res) => {
  try {
    // FIX: Use barber.id OR barber.barberId
    const barberId = req.barber.id || req.barber.barberId;
    const { customerId } = req.params;

    // Validate barberId exists
    if (!barberId) {
      return res.status(400).json({
        message: 'Barber ID not found in token'
      });
    }

    const customer = await Customer.findOne({
      _id: customerId,
      barber: barberId,
      status: { $in: ['waiting', 'in_service'] } // Changed 'in_progress' to 'in_service'
    });

    if (!customer) {
      return res.status(404).json({
        message: 'Customer not found or already completed'
      });
    }

    customer.status = 'no_show';
    customer.completedAt = new Date();
    await customer.save();

    const queueState = await getQueueForBarber(barberId);

    res.json({
      message: 'Customer marked as no-show',
      queueState
    });

  } catch (err) {
    console.error('No-show error:', err);
    res.status(500).json({ 
      message: 'Server error marking no-show',
      error: err.message 
    });
  }
};