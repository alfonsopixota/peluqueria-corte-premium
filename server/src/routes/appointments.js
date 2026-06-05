const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { auth } = require('../middleware/auth');
const { sendConfirmation } = require('../email.service');

router.get('/', auth, async (req, res) => {
  try {
    const filter = req.userRole === 'admin' ? {} : { userId: req.userId };
    const appointments = await Appointment.find(filter).sort({ createdAt: -1 });
    res.json(appointments);
  } catch (e) {
    console.error('Error al obtener citas:', e);
    res.status(500).json({ error: 'Error al obtener citas.' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada.' });
    }
    if (req.userRole !== 'admin' && appointment.userId?.toString() !== req.userId) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta cita.' });
    }
    res.json(appointment);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la cita.' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { services, stylist, date, time, client, totalPrice, totalDuration } = req.body;

    if (!services?.length || !stylist || !date || !time || !client?.name) {
      return res.status(400).json({ error: 'Faltan datos requeridos para la cita.' });
    }

    const existing = await Appointment.findOne({ date, time, 'stylist.id': stylist.id, status: 'confirmed' });
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una cita confirmada para ese barbero en esa fecha y hora.' });
    }

    const appointment = new Appointment({
      userId: req.userId,
      services,
      stylist,
      date,
      time,
      client,
      totalPrice,
      totalDuration,
    });

    await appointment.save();

    sendConfirmation(appointment).catch(err =>
      console.error('Error al enviar email:', err)
    );

    res.status(201).json(appointment);
  } catch (e) {
    console.error('Error al crear cita:', e);
    res.status(500).json({ error: 'Error al crear la cita.' });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada.' });
    }
    if (req.userRole !== 'admin' && appointment.userId?.toString() !== req.userId) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta cita.' });
    }

    const allowedFields = ['time', 'status', 'client', 'services'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        appointment[field] = req.body[field];
      }
    }

    await appointment.save();
    res.json(appointment);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar la cita.' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada.' });
    }
    if (req.userRole !== 'admin' && appointment.userId?.toString() !== req.userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta cita.' });
    }

    appointment.status = 'cancelled';
    await appointment.save();
    res.json({ message: 'Cita cancelada correctamente.' });
  } catch (e) {
    res.status(500).json({ error: 'Error al cancelar la cita.' });
  }
});

module.exports = router;
