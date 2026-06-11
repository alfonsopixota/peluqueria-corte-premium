const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { sendConfirmation } = require('../email.service');
const { resolveServices } = require('../utils/service-catalog');
const { hasConflict } = require('../utils/appointments');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Appointment = require('../models/Appointment');

async function createAppointmentFromSession(session) {
  // 1. Idempotencia: si la sesión ya fue procesada, devolver la cita existente.
  const existing = await Appointment.findOne({ stripeSessionId: session.id });
  if (existing) return existing;

  const meta = session.metadata;
  const stylist = JSON.parse(meta.stylist);
  const resolved = resolveServices(meta.serviceIds.split(',').map(Number));

  // 2. Si la franja ya está ocupada por OTRA cita, se guarda para revisión manual
  //    en vez de rechazar el pago (el cliente ya pagó).
  const conflict = await hasConflict(meta.date, meta.time, stylist.id);

  const appointment = new Appointment({
    userId: meta.userId,
    services: resolved.services,
    stylist,
    date: meta.date,
    time: meta.time,
    client: {
      name: meta.clientName,
      email: meta.clientEmail,
      phone: meta.clientPhone,
      notes: meta.clientNotes,
    },
    totalPrice: resolved.totalPrice,
    totalDuration: resolved.totalDuration,
    stripeSessionId: session.id,
    status: conflict ? 'pending_review' : 'confirmed',
  });

  try {
    await appointment.save();
  } catch (e) {
    // Carrera ganada por otra petición entre el findOne y el save:
    // - 11000 en stripeSessionId → ya existe esta cita, devolverla (idempotencia).
    // - 11000 en el índice date/time/stylist → la franja se ocupó; reintentar como pending_review.
    if (e.code === 11000) {
      const dup = await Appointment.findOne({ stripeSessionId: session.id });
      if (dup) return dup;
      appointment.status = 'pending_review';
      await appointment.save();
      console.error(`⚠️ Conflicto de doble reserva (carrera) — cita ${session.id} guardada como pending_review`);
      return appointment;
    }
    throw e;
  }

  if (appointment.status === 'pending_review') {
    console.error(`⚠️ Conflicto de doble reserva — cita ${session.id} guardada como pending_review`);
  } else {
    sendConfirmation(appointment).catch(err =>
      console.error('Error al enviar email:', err)
    );
  }

  return appointment;
}

router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const { services: frontendServices, stylist, date, time, client } = req.body;

    if (!frontendServices?.length || !stylist || !date || !time || !client?.name) {
      return res.status(400).json({ error: 'Faltan datos de la cita.' });
    }

    const resolved = resolveServices(frontendServices);
    if (resolved.error) {
      return res.status(400).json({ error: resolved.error });
    }
    const { serviceIds, services, totalPrice, totalDuration } = resolved;

    const conflict = await hasConflict(date, time, stylist.id);
    if (conflict) {
      return res.status(409).json({ error: 'Ya existe una cita confirmada para ese barbero en esa fecha y hora.' });
    }

    const miniStylist = {
      id: stylist.id, name: stylist.name, title: stylist.title,
      specialties: stylist.specialties, rating: stylist.rating,
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: services.map(s => ({
        price_data: {
          currency: 'eur',
          product_data: { name: s.name },
          unit_amount: s.price * 100,
        },
        quantity: 1,
      })),
      customer_email: client.email,
      metadata: {
        userId: req.userId,
        serviceIds: serviceIds.join(','),
        stylist: JSON.stringify(miniStylist),
        date,
        time,
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.phone,
        clientNotes: client.notes || '',
        totalPrice: String(totalPrice),
        totalDuration: String(totalDuration),
      },
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reservar/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reservar/paso-4`,
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error('Error al crear sesión de pago:', e);
    res.status(500).json({ error: 'Error al procesar el pago.' });
  }
});

router.get('/checkout-success', auth, async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ error: 'Falta session_id.' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'El pago no fue completado.' });
    }

    // La sesión debe pertenecer al usuario autenticado: nadie puede materializar
    // (ni leer) la cita de otro pasando un session_id ajeno.
    if (session.metadata?.userId !== req.userId) {
      return res.status(403).json({ error: 'Esta sesión de pago no te pertenece.' });
    }

    const appointment = await createAppointmentFromSession(session);
    res.json(appointment);
  } catch (e) {
    console.error('Error en checkout-success:', e);
    res.status(500).json({ error: 'Error al verificar el pago.' });
  }
});

async function handleWebhook(req, res) {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      console.warn('⚠️ Webhook sin STRIPE_WEBHOOK_SECRET — saltando verificación de firma');
      event = JSON.parse(req.body.toString());
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await createAppointmentFromSession(session);
    }

    res.json({ received: true });
  } catch (e) {
    console.error('Error en webhook:', e);
    res.status(400).send(`Webhook Error: ${e.message}`);
  }
}

module.exports = router;
module.exports.handleWebhook = handleWebhook;
