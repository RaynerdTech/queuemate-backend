const mongoose = require('mongoose');

const BarberSchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  name: { type: String, required: true },
  status: { type: String, default: 'active' }, // active, break, off
  services: [{
    name: String,
    duration: Number // minutes
  }],
  avgDuration: { type: Number, default: 30 },

  // NEW FIELDS
  accessCode: { type: String, required: true }, // e.g., BK-4921
  isActive: { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Barber', BarberSchema);
