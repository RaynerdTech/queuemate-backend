// models/Customer.js
const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  barber: { type: mongoose.Schema.Types.ObjectId, ref: 'Barber', required: false },
  name: { type: String, required: true },
  phone: String,
  serviceName: String,
  serviceDuration: Number, // minutes
  status: { type: String, default: 'waiting' }, // waiting, in_service, completed, no_show, cancelled
  position: Number,
  note: String,      
  createdAt: { type: Date, default: Date.now },
  startedAt: Date,
  completedAt: Date
});

module.exports = mongoose.model('Customer', CustomerSchema);
