// models/Shop.js
const mongoose = require('mongoose');

const ShopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, // e.g., fade-masters-abc123

  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },

  phone: String,
  location: String,
  hours: String,
  status: { type: String, default: 'closed' }, // open, closed, frozen
  createdAt: { type: Date, default: Date.now },

  // For quick stats
  dailyStats: { type: Object, default: {} },
});

module.exports = mongoose.model('Shop', ShopSchema);
