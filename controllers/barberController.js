const Barber = require('../models/Barber');
const User = require('../models/User');
const Shop = require('../models/Shop');
const jwt = require('jsonwebtoken');

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

    // Check if req.user.id exists
    if (!req.user || !req.user.id) {
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




exports.deleteBarber = async (req, res) => {
  try {
    // 1. Get logged-in user and check shop ownership
    const user = await User.findById(req.user.id);
    if (!user || !user.shop) {
      return res.status(403).json({ message: 'User has no shop' });
    }

    // 2. Find and delete the barber
    // We filter by both _id and shop to ensure security
    const deletedBarber = await Barber.findOneAndDelete({ 
      _id: req.params.barberId, 
      shop: user.shop 
    });

    if (!deletedBarber) {
      return res.status(404).json({ message: 'Barber not found or unauthorized' });
    }

    res.json({ message: 'Barber deleted successfully', id: req.params.barberId });
  } catch (err) {
    console.error("Error in deleteBarber:", err);
    res.status(500).json({ message: 'Server error' });
  }
};



// barber login using access code
exports.accessBarberDashboard = async (req, res) => {
  try {
    const { shopCode, accessCode } = req.body;

    if (!shopCode || !accessCode) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    // 1. Find shop by shopCode
    const shop = await Shop.findOne({ shopCode });
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // 2. Find barber under THIS shop with accessCode
    const barber = await Barber.findOne({
      shop: shop._id,
      accessCode,
      isActive: true
    });

    if (!barber) {
      return res.status(401).json({ message: "Invalid access code" });
    }

    // 3. Generate token (DO NOT STORE)
    const token = jwt.sign(
      {
        barberId: barber._id,
        shopId: shop._id,
        role: 'barber'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 4. Return token + barber identity
    res.json({
      token,
      barber: {
        id: barber._id,
        name: barber.name,
        status: barber.status,
        services: barber.services,
        avgDuration: barber.avgDuration
      },
      shop: {
        id: shop._id,
        name: shop.name,
        slug: shop.slug
      }
    });

  } catch (err) {
    console.error('Barber login error:', err);
    res.status(500).json({ message: "Server error" });
  }         
};


// get barber profile
exports.getBarberProfile = async (req, res) => {
  try {
    const barberId = req.barber.barberId;

    const barber = await Barber.findById(barberId)
      .populate('shop', 'name slug shopCode') // Populate shop info
      .select('-accessCode'); // Don't send accessCode for security

    if (!barber) {
      return res.status(404).json({ message: "Barber not found" });
    }

    res.json({
      barber: {
        id: barber._id,
        name: barber.name,
        status: barber.status,
        services: barber.services,
        avgDuration: barber.avgDuration,
        isActive: barber.isActive,
        createdAt: barber.createdAt
      },
      shop: barber.shop
    });
  } catch (err) {
    console.error('Get barber profile error:', err);
    res.status(500).json({ message: "Server error" });
  }
};