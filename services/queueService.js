// services/queueService.js
const Customer = require('../models/Customer');
const Barber = require('../models/Barber');
const { calculateQueueState } = require('./queueCalculator');

async function getQueueForBarber(barberId) {
  const barber = await Barber.findById(barberId).populate('shop').lean();

  const customers = await Customer.find({
    barber: barberId,
    status: { $in: ['waiting', 'in_service'] },
  })
    .sort({ createdAt: 1 })
    .lean();

  const shopHours = barber?.shop?.hours || null;
  const timezone = barber?.shop?.timezone || 'UTC'; // e.g. "America/New_York"

  return calculateQueueState(customers, new Date(), shopHours, timezone);
}

// Call this when shop owner manually closes the shop
async function cancelRemainingQueueOnClose(shopId) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const result = await Customer.updateMany(
    {
      shop: shopId,
      status: 'waiting',
      createdAt: { $gte: startOfToday },
    },
    {
      status: 'cancelled',
      cancelReason: 'shop_closed',
    }
  );

  return result.modifiedCount;
}

module.exports = { getQueueForBarber, cancelRemainingQueueOnClose };