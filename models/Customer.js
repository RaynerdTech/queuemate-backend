const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    barber: { type: mongoose.Schema.Types.ObjectId, ref: 'Barber', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    serviceName: { type: String, required: true },
    serviceDuration: { type: Number, required: true, min: 1 },
    status: { 
      type: String, 
      enum: ['waiting', 'in_service', 'completed', 'cancelled', 'no_show'], 
      default: 'waiting', 
      index: true 
    },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    note: { type: String, trim: true },
    queueToken: { type: String, unique: true, index: true }
  },
  { timestamps: true }
);

CustomerSchema.index({ barber: 1, status: 1, createdAt: 1 });
CustomerSchema.index({ shop: 1, status: 1, createdAt: 1 });

module.exports = mongoose.model('Customer', CustomerSchema);
