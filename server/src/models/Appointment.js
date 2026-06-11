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
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed', 'pending_review'],
    default: 'confirmed',
  },
  stripeSessionId: { type: String },
}, { timestamps: true });

// Idempotencia de Stripe a nivel BD: dos webhooks/reintentos de la misma
// sesión no pueden crear citas duplicadas (sparse para permitir reservas sin pago).
appointmentSchema.index({ stripeSessionId: 1 }, { unique: true, sparse: true });

// Garantía real anti-doble-reserva: una sola cita confirmed por barbero/fecha/hora.
// El índice parcial solo aplica a 'confirmed', así que canceladas no bloquean la franja.
appointmentSchema.index(
  { date: 1, time: 1, 'stylist.id': 1 },
  { unique: true, partialFilterExpression: { status: 'confirmed' } }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
