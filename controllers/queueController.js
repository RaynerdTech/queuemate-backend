const Customer = require('../models/Customer');
const Shop = require('../models/Shop');
const Barber = require('../models/Barber');
const crypto = require('crypto');
const { getQueueForBarber } = require('../services/queueService');

/**
 * Generate unique queue token
 */
function generateQueueToken() {
  return `q_${crypto.randomBytes(6).toString('hex')}`;
}

/**
 * VIEW QUEUE - For customers to see queue of a barber
 */
exports.viewQueue = async (req, res) => {
  const { barberId } = req.params;

  try {
    const queueState = await getQueueForBarber(barberId);

    const currentlyServingCustomer = await Customer.findOne({
      barber: barberId,
      status: 'in_service'
    }).select('_id name serviceName startedAt serviceDuration')

    let remainingCurrentMinutes = 0;

    if (currentlyServingCustomer) {
      const now = new Date();
      const startedAt = new Date(currentlyServingCustomer.startedAt);

      const elapsedMinutes = Math.floor((now - startedAt) / 60000);
      remainingCurrentMinutes = Math.max(
        currentlyServingCustomer.serviceDuration - elapsedMinutes,
        0
      );
    }

    // Sum of all queued service durations
    const queueTotalMinutes = queueState.queue.reduce(
      (total, customer) => total + (customer.serviceDuration || 0),
      0
    );

    const totalEstimatedWaitMinutes =
      remainingCurrentMinutes + queueTotalMinutes;

    res.json({
      paused: queueState.paused,
      queue: queueState.queue,
      currentlyServing: currentlyServingCustomer
        ? {
          customerId: currentlyServingCustomer._id,
            name: currentlyServingCustomer.name,
            serviceName: currentlyServingCustomer.serviceName,
            startedAt: currentlyServingCustomer.startedAt,
            serviceDuration: currentlyServingCustomer.serviceDuration
          }
        : null,

      // 👇 New field (won’t break frontend)
      totalEstimatedWaitMinutes
    });

  } catch (err) {
    console.error('Error fetching queue:', err);
    res.status(500).json({ message: 'Server error fetching queue' });
  }
};



/**
 * JOIN QUEUE - Customer joins via public shop link (using slug)
 */
exports.joinQueue = async (req, res) => {
  try {
    const { slug } = req.params; // shop slug
    const { barberId, name, phone, serviceId } = req.body;

    // Validation
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
    if (!barberId) return res.status(400).json({ message: 'Barber is required' });
    if (!serviceId) return res.status(400).json({ message: 'Service selection is required' });

    // Find shop by slug
    const shop = await Shop.findOne({ slug, status: 'open' });
    if (!shop) return res.status(404).json({ message: 'Shop not found or closed' });

    // Verify barber belongs to this shop
    const barber = await Barber.findOne({ _id: barberId, shop: shop._id, status: 'active' });
    if (!barber) return res.status(400).json({ message: 'Barber not found or inactive' });

    // Lookup service in barber's services
    const service = barber.services.id(serviceId);
    if (!service) return res.status(400).json({ message: 'Service not found for this barber' });

    // Generate unique queue token
    let queueToken, exists = true, attempts = 0;
    while (exists && attempts < 5) {
      queueToken = generateQueueToken();
      exists = await Customer.exists({ queueToken });
      attempts++;
    }
    if (exists) return res.status(500).json({ message: 'Could not generate unique token' });

    // Create customer in queue
    const customer = await Customer.create({
      shop: shop._id,
      barber: barber._id,
      name: name.trim(),
      phone: phone?.trim(),
      serviceId,
      serviceName: service.name,
      serviceDuration: service.duration,
      queueToken
    });

    // Return updated queue
    const queueState = await getQueueForBarber(barber._id);
    const myData = queueState.queue.find(c => c.customerId.toString() === customer._id.toString());

    res.status(201).json({
      queueToken,
      position: myData?.position || 1,
      etaMinutes: myData?.etaMinutes || 0,
      paused: queueState.paused
    });

  } catch (err) {
    console.error('Error in joinQueue:', err);
    res.status(500).json({ message: 'Server error joining queue' });
  }
};

/**
 * LEAVE QUEUE - Customer cancels before service
 */
exports.leaveQueue = async (req, res) => {
  try {
    const { queueToken } = req.body;

    if (!queueToken) return res.status(400).json({ message: 'Queue token required' });

    // Find customer in waiting status
    const customer = await Customer.findOne({ queueToken, status: 'waiting' });
    if (!customer) return res.status(404).json({ message: 'Customer not in queue or already served' });

    // Mark as cancelled
    customer.status = 'cancelled';
    await customer.save();

    // Return updated queue
    const queueState = await getQueueForBarber(customer.barber);
    res.json({ message: 'Successfully left queue', queueState });

  } catch (err) {
    console.error('Error in leaveQueue:', err);
    res.status(500).json({ message: 'Server error leaving queue' });
  }
};





/**
 * GET PERSONAL QUEUE STATUS - Customer views their own queue
 */
exports.getMyQueue = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Queue token missing' });
    }

    const queueToken = authHeader.split(' ')[1];

    // Find customer (allow both waiting + in_service)
    const customer = await Customer.findOne({
      queueToken,
      status: { $in: ['waiting', 'in_service'] }
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not in queue' });
    }

    // Get full queue state
    const queueState = await getQueueForBarber(customer.barber);

    // Find this customer in queue list
    const myData = queueState.queue.find(
      c => c.customerId.toString() === customer._id.toString()
    );

    // Find currently serving customer
    const currentlyServingCustomer = await Customer.findOne({
      barber: customer.barber,
      status: 'in_service'
    }).select('name serviceName startedAt serviceDuration');

    // Load shop + barber names
    const barber = await Barber.findById(customer.barber).select('name');
    const shop = await Shop.findById(customer.shop).select('name slug');

    res.json({
      shop: {
        name: shop?.name,
        slug: shop?.slug
      },
      barber: {
        name: barber?.name
      },
      paused: queueState.paused,

      currentlyServing: currentlyServingCustomer
        ? {
            name: currentlyServingCustomer.name,
            serviceName: currentlyServingCustomer.serviceName,
            startedAt: currentlyServingCustomer.startedAt,
            serviceDuration: currentlyServingCustomer.serviceDuration
          }
        : null,

      you: {
        status: customer.status,
        name: customer.name,
        serviceName: customer.serviceName,
        position: myData?.position ?? 0,
        etaMinutes: myData?.etaMinutes ?? 0
      }
    });

  } catch (err) {
    console.error('Error fetching personal queue:', err);
    res.status(500).json({ message: 'Server error fetching queue' });
  }
};
