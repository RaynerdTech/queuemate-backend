const Customer = require('../models/Customer');
const { calculateQueueState } = require('./queueCalculator');

async function getQueueForBarber(barberId) {
  const customers = await Customer.find({
    barber: barberId,
    status: { $in: ['waiting', 'in_service'] }
  })
    .sort({ createdAt: 1 })
    .lean();

  return calculateQueueState(customers);
}

module.exports = { getQueueForBarber };
