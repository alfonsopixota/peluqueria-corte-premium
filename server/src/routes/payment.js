const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const { services, stylist, date, time, client, totalPrice, totalDuration } = req.body;

    if (!services?.length || !stylist || !date || !time || !client?.name) {
      return res.status(400).json({ error: 'Faltan datos de la cita.' });
    }

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
        services: JSON.stringify(services),
        stylist: JSON.stringify(stylist),
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

    const Appointment = require('../models/Appointment');
    const existing = await Appointment.findOne({ stripeSessionId: session_id });
    if (existing) {
      return res.json(existing);
    }

    const meta = session.metadata;
    const appointment = new Appointment({
      userId: meta.userId,
      services: JSON.parse(meta.services),
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
      stripeSessionId: session_id,
      status: 'confirmed',
    });

    await appointment.save();

    const { sendConfirmation } = require('../email.service');
    sendConfirmation(appointment).catch(err =>
      console.error('Error al enviar email:', err)
    );

    res.json(appointment);
  } catch (e) {
    console.error('Error en checkout-success:', e);
    res.status(500).json({ error: 'Error al verificar el pago.' });
  }
});

module.exports = router;
