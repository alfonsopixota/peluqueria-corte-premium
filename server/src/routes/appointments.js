const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { auth, adminOnly } = require('../middleware/auth');
const { sendConfirmation } = require('../email.service');
const { resolveServices } = require('../utils/service-catalog');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function parseStylistId(stylistId) {
  const parsed = Number(stylistId);
  return Number.isInteger(parsed) ? parsed : null;
}

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

router.get('/availability', async (req, res) => {
  try {
    const { date, stylistId } = req.query;
    if (!date || !stylistId) {
      return res.status(400).json({ error: 'Se requieren date y stylistId.' });
    }

    const parsedStylistId = parseStylistId(stylistId);
    if (!DATE_RE.test(String(date)) || parsedStylistId === null) {
      return res.status(400).json({ error: 'Fecha o barbero no válidos.' });
    }

    const times = await Appointment.find({
      date,
      'stylist.id': parsedStylistId,
      status: 'confirmed',
    }).select('time -_id').lean();

    res.json(times.map(t => t.time));
  } catch (e) {
    console.error('Error al obtener disponibilidad:', e);
    res.status(500).json({ error: 'Error al obtener disponibilidad.' });
  }
});

router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [total, confirmed, cancelled, todayCount, revenue, byBarber, recent] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'confirmed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Appointment.countDocuments({ date: today, status: 'confirmed' }),
      Appointment.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
      Appointment.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: '$stylist.name', count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
        { $sort: { count: -1 } },
      ]),
      Appointment.find({ status: 'confirmed' }).sort({ createdAt: -1 }).limit(5),
    ]);

    res.json({
      total,
      confirmed,
      cancelled,
      today: todayCount,
      revenue: revenue[0]?.total || 0,
      byBarber,
      recent,
    });
  } catch (e) {
    console.error('Error al obtener estadísticas:', e);
    res.status(500).json({ error: 'Error al obtener estadísticas.' });
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
    const { services: frontendServices, stylist, date, time, client } = req.body;

    if (!frontendServices?.length || !stylist?.id || !date || !time || !client?.name || !client?.email || !client?.phone) {
      return res.status(400).json({ error: 'Faltan datos requeridos para la cita.' });
    }

    const stylistId = parseStylistId(stylist.id);
    if (stylistId === null || !DATE_RE.test(date) || !TIME_RE.test(time)) {
      return res.status(400).json({ error: 'Fecha, hora o barbero no válidos.' });
    }

    const resolved = resolveServices(frontendServices);
    if (resolved.error) {
      return res.status(400).json({ error: resolved.error });
    }

    const existing = await Appointment.findOne({ date, time, 'stylist.id': stylistId, status: 'confirmed' });
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una cita confirmada para ese barbero en esa fecha y hora.' });
    }

    const appointment = new Appointment({
      userId: req.userId,
      services: resolved.services,
      stylist: { ...stylist, id: stylistId },
      date,
      time,
      client,
      totalPrice: resolved.totalPrice,
      totalDuration: resolved.totalDuration,
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
