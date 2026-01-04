const Barber = require('../models/Barber');
const User = require('../models/User');

// Helper: generate unique access code per shop
async function generateUniqueAccessCode(shopId) {
  let accessCode;
  let exists = true;

  while (exists) {
    accessCode = "BK-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    exists = await Barber.exists({ shop: shopId, accessCode });
  }

  return accessCode;
}

exports.createBarber = async (req, res) => {
  try {
    // 1. Get logged-in user
    const user = await User.findById(req.user.id);
    if (!user || !user.shop) {
      return res.status(403).json({ message: 'User has no shop' });
    }

    // 2. Create barber under user's shop
    const { name, services, status, avgDuration } = req.body;

    // Generate unique access code for barber
    const accessCode = await generateUniqueAccessCode(user.shop);

    const barber = await Barber.create({
      shop: user.shop,
      name,
      services,
      status,
      avgDuration,
      accessCode,
      isActive: true // default active
    });

    res.status(201).json(barber);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getBarbers = async (req, res) => {
  try {
    console.log("=== GET /barbers DEBUG START ===");

    // Check if req.user.id exists
    if (!req.user || !req.user.id) {
      console.log("No user in request. Did auth middleware run?");
      return res.status(401).json({ message: "Unauthorized: no user in token" });
    }

    // console.log("Token user id:", req.user.id);

    // Fetch user from DB
    const user = await User.findById(req.user.id);
    // console.log("User from DB:", user);

    if (!user) {
      // console.log("User not found in DB.");
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.shop) {
      // console.log("User has no shop assigned.");
      return res.status(403).json({ message: "User has no shop" });
    }

    // console.log("User shop id:", user.shop);

    // Fetch barbers for the user's shop
    const barbers = await Barber.find({ shop: user.shop });
    console.log("Barbers found:", barbers);

    res.json(barbers);

    // console.log("=== GET /barbers DEBUG END ===");
  } catch (err) {
    console.error("Error in getBarbers:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.updateBarber = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.shop) {
      return res.status(403).json({ message: 'User has no shop' });
    }

    // 🔒 ensure barber belongs to user's shop
    const updated = await Barber.findOneAndUpdate(
      { _id: req.params.barberId, shop: user.shop },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Barber not found' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
