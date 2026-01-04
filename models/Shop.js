const mongoose = require('mongoose');

const ShopSchema = new mongoose.Schema({
  name: { type: String, required: true },

  // Public, SEO / URL friendly
  slug: { type: String, required: true, unique: true }, 
  // e.g. fade-masters-abc123

  // Human-friendly tenant identifier (VERY IMPORTANT)
  shopCode: {
    type: String,
    required: true,
    unique: true,
    immutable: true, // cannot be changed after creation
  }, // e.g. SHOP-A9F3

  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },

  phone: String,
  location: String,
  hours: String,

  status: { 
    type: String, 
    // enum: ['open', 'closed', 'frozen'],
    default: 'closed'
  },

  // For quick stats
  dailyStats: { type: Object, default: {} },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Shop', ShopSchema);
