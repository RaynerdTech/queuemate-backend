function calculateQueueState(customers, now = new Date()) {
  let paused = false;
  let cumulativeMinutes = 0;
  const queue = [];

  // Sort customers by join time
  const ordered = customers.sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  // Find in-service customer
  const inServiceIndex = ordered.findIndex(c => c.status === 'in_service');
  const inService = ordered[inServiceIndex];

  // 1️⃣ Handle in-service customer
  if (inService && inService.startedAt) {
    const elapsed =
      (now - new Date(inService.startedAt)) / 60000;

    const remaining = Math.max(
      inService.serviceDuration - elapsed,
      0
    );

    if (remaining === 0) paused = true;

    cumulativeMinutes = remaining;
  }

  // 2️⃣ Handle waiting customers AFTER in-service
  ordered.forEach((c, index) => {
    if (c.status !== 'waiting') return;

    // Count only people ahead
    const peopleAhead = ordered.filter(
      (p, i) =>
        i < index &&
        (p.status === 'in_service' || p.status === 'waiting')
    );

    let eta = 0;

    peopleAhead.forEach(p => {
      if (p.status === 'in_service' && p.startedAt) {
        const elapsed =
          (now - new Date(p.startedAt)) / 60000;
        eta += Math.max(p.serviceDuration - elapsed, 0);
      } else {
        eta += p.serviceDuration;
      }
    });

    queue.push({
      customerId: c._id,
      name: c.name,
      phone: c.phone,
      serviceName: c.serviceName,
      serviceDuration: c.serviceDuration,
      position: queue.length + 1,
      etaMinutes: Math.ceil(eta)
    });
  });

  return { paused, queue };
}

module.exports = { calculateQueueState };