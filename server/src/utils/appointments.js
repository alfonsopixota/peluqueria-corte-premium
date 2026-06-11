const Appointment = require('../models/Appointment');

/**
 * Comprueba si ya existe una cita CONFIRMADA para el mismo barbero,
 * fecha y hora. Es la primera línea de defensa anti-doble-reserva;
 * la garantía dura la da el índice único parcial del modelo.
 */
async function hasConflict(date, time, stylistId) {
  const existing = await Appointment.findOne({
    date,
    time,
    'stylist.id': Number(stylistId),
    status: 'confirmed',
  });
  return !!existing;
}

module.exports = { hasConflict };
