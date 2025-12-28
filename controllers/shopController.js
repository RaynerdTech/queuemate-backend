// controllers/shopController.js
const Shop = require('../models/Shop');
const slugify = require('slugify');
const mongoose = require('mongoose');
const User = require("../models/User");


exports.createShop = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Prevent multiple shops
    const existingShop = await Shop.findOne({ owner: req.user.id });
    if (existingShop) {
      return res.status(400).json({
        message: "You already created a shop.",
        shopId: existingShop._id,
        slug: existingShop.slug
      });
    }

    const { name, phone, location, hours } = req.body;

    // Slug generation
    const baseSlug = slugify(name || "shop", { lower: true, strict: true });
    const unique = Date.now().toString(36).slice(-6);
    const slug = `${baseSlug}-${unique}`;

    // Create shop
    const shop = new Shop({
      name,
      phone,
      location,
      hours,
      slug,
      status: "open",
      owner: req.user.id
    });

    await shop.save();

    // Update user model with this shop
    await User.findByIdAndUpdate(
      req.user.id,
      { shop: shop._id }, // ✅ Correct
      { new: true }
    );

    res.status(201).json(shop);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



// GET SHOP — Only owner of shop can view it
exports.getShop = async (req, res) => {
  try {
    const { slugOrId } = req.params;

    const query = mongoose.Types.ObjectId.isValid(slugOrId)
      ? { _id: slugOrId }
      : { slug: slugOrId };

    const shop = await Shop.findOne(query);

    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    if (shop.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed to access this shop" });
    }

    res.json(shop);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// UPDATE SHOP — Only owner can update their shop
exports.updateShop = async (req, res) => {
  try {
    const { slugOrId } = req.params;

    const query = mongoose.Types.ObjectId.isValid(slugOrId)
      ? { _id: slugOrId }
      : { slug: slugOrId };

    let shop = await Shop.findOne(query);

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Permission check
    if (shop.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed to update this shop" });
    }

    const { name, phone, location, hours, status } = req.body;

    // If name changed → regenerate slug
    if (name && name !== shop.name) { 
      const baseSlug = slugify(name, { lower: true, strict: true });
      const unique = Date.now().toString(36).slice(-6);
      shop.slug = `${baseSlug}-${unique}`;
    }

    // Update fields
    if (name) shop.name = name;
    if (phone) shop.phone = phone;
    if (location) shop.location = location;
    if (hours) shop.hours = hours;
    if (status) shop.status = status;

    await shop.save();

    res.json({ message: 'Shop updated successfully', shop });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
