const Appointment = require('../models/Appointment');

/**
 * Comprueba si ya existe una cita CONFIRMADA para el mismo barbero,
 * fecha y hora. Es la primera línea de defensa anti-doble-reserva;
 * la garantía dura la da el índice único parcial del modelo.
 *
 * @param {string} date     Fecha en formato YYYY-MM-DD (hora local del local).
 * @param {string} time     Hora en formato HH:mm (hora local del local).
 * @param {number|string} stylistId  Id del barbero.
 * @param {object} [model]  Modelo inyectable (para test); por defecto Appointment.
 */
async function hasConflict(date, time, stylistId, model = Appointment) {
  const existing = await model.findOne({
    date,
    time,
    'stylist.id': Number(stylistId),
    status: 'confirmed',
  });
  return !!existing;
}

module.exports = { hasConflict };
