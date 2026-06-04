const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  services: [{
    id: Number,
    name: String,
    category: String,
    description: String,
    price: Number,
    duration: Number,
    image: String,
  }],
  stylist: {
    id: Number,
    name: String,
    title: String,
    bio: String,
    specialties: [String],
    image: String,
    rating: Number,
  },
  date: { type: String, required: true },
  time: { type: String, required: true },
  client: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    notes: String,
  },
  totalPrice: Number,
  totalDuration: Number,
  status: { type: String, enum: ['confirmed', 'cancelled', 'completed'], default: 'confirmed' },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
