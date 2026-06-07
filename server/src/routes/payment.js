const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const catalogServices = require('../data/services');

async function createAppointmentFromSession(session) {
  const meta = session.metadata;
  const serviceIds = meta.serviceIds.split(',').map(Number);
  const services = catalogServices.filter(s => serviceIds.includes(s.id));

  const Appointment = require('../models/Appointment');
  const existing = await Appointment.findOne({ stripeSessionId: session.id });
  if (existing) return existing;

  const appointment = new Appointment({
    userId: meta.userId,
    services,
    stylist: JSON.parse(meta.stylist),
    date: meta.date,
    time: meta.time,
    client: {
      name: meta.clientName,
      email: meta.clientEmail,
      phone: meta.clientPhone,
      notes: meta.clientNotes,
    },
    totalPrice: parseInt(meta.totalPrice),
    totalDuration: parseInt(meta.totalDuration),
    stripeSessionId: session.id,
    status: 'confirmed',
  });

  await appointment.save();

  const { sendConfirmation } = require('../email.service');
  sendConfirmation(appointment).catch(err =>
    console.error('Error al enviar email:', err)
  );

  return appointment;
}

router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const { services: frontendServices, stylist, date, time, client } = req.body;

    if (!frontendServices?.length || !stylist || !date || !time || !client?.name) {
      return res.status(400).json({ error: 'Faltan datos de la cita.' });
    }

    const serviceIds = frontendServices.map(s => Number(s.id));
    const services = catalogServices.filter(s => serviceIds.includes(s.id));

    if (services.length !== serviceIds.length) {
      return res.status(400).json({ error: 'Uno o más servicios no encontrados.' });
    }

    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);

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
