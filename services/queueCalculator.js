// services/queueCalculator.js

// Returns "YYYY-MM-DD" in the given timezone
function getLocalDateString(date, timezone) {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: timezone });
}

// Returns total minutes since midnight in the given timezone
function getLocalMinutes(date, timezone) {
  const str = new Date(date).toLocaleString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const [hour, min] = str.split(':').map(Number);
  return hour * 60 + min;
}

// Parses "9:00 AM - 7:00 PM" → { openHour, openMin, closeHour, closeMin }
function parseShopHours(hoursString) {
  if (!hoursString) return null;
  try {
    const [openPart, closePart] = hoursString.split(' - ');

    const parseTime = (str) => {
      const [time, meridiem] = str.trim().split(' ');
      let [hour, min] = time.split(':').map(Number);
      if (meridiem === 'PM' && hour !== 12) hour += 12;
      if (meridiem === 'AM' && hour === 12) hour = 0;
      return { hour, min };
    };

    const open = parseTime(openPart);
    const close = parseTime(closePart);
    return {
      openHour: open.hour,
      openMin: open.min,
      closeHour: close.hour,
      closeMin: close.min,
    };
  } catch {
    return null;
  }
}

function calculateQueueState(customers, now = new Date(), shopHours = null, timezone = 'Africa/Lagos') {
  // Get today's date string in the shop's local timezone
  // e.g. Nigeria at 1:00 AM Monday = "2026-02-23", not "2026-02-22" (UTC)
  const todayInShopTz = getLocalDateString(now, timezone);

  // Filter customers whose createdAt is "today" in the shop's timezone
  // A customer created at 10:59 PM Sunday will have date "2026-02-22" in WAT
  // and will correctly be excluded after midnight local time
  const todaysCustomers = customers.filter(
    c => getLocalDateString(c.createdAt, timezone) === todayInShopTz
  );

  // Check closing time using shop's local clock
  const hours = parseShopHours(shopHours);
  if (hours) {
    const shopNowMinutes = getLocalMinutes(now, timezone);
    const closeMinutes = hours.closeHour * 60 + hours.closeMin;

    if (shopNowMinutes >= closeMinutes) {
      return {
        paused: true,
        shopClosed: true,
        queue: [],
        currentlyServing: null,
        cancelledAtClose: todaysCustomers.filter(c => c.status === 'waiting').length,
      };
    }
  }

  let paused = false;
  const queue = [];

  // Sort by join time
  const ordered = todaysCustomers.sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  // Find in-service customer — also scoped to today so yesterday's
  // in-service customer doesn't get stuck in the response
  const inService = ordered.find(c => c.status === 'in_service') || null;

  // Calculate remaining time for in-service customer
  let inServiceRemaining = 0;
  if (inService && inService.startedAt) {
    const elapsed = (now - new Date(inService.startedAt)) / 60000;
    inServiceRemaining = Math.max(inService.serviceDuration - elapsed, 0);
    if (inServiceRemaining === 0) paused = true;
  }

  // Paused if no one is in service but people are waiting
  if (!inService && ordered.some(c => c.status === 'waiting')) {
    paused = true;
  }

  // O(N) ETA — running cumulative sum, no inner loops
  let cumulativeEta = inServiceRemaining;

  ordered.forEach(c => {
    if (c.status !== 'waiting') return;

    queue.push({
      customerId: c._id,
      name: c.name,
      phone: c.phone,
      serviceName: c.serviceName,
      serviceDuration: c.serviceDuration,
      position: queue.length + 1,
      etaMinutes: Math.ceil(cumulativeEta),
    });

    cumulativeEta += c.serviceDuration;
  });

  return { paused, shopClosed: false, queue, currentlyServing: inService };
}

module.exports = { calculateQueueState, parseShopHours };