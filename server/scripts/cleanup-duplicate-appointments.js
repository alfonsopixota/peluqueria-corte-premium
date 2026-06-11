'use strict';

/**
 * Limpieza de citas CONFIRMED duplicadas (mismo barbero + fecha + hora).
 *
 * Por qué existe
 * --------------
 * El modelo Appointment declara un índice único parcial sobre
 * `{ date, time, 'stylist.id' }` filtrado a `status: 'confirmed'`. Si la base de
 * datos YA contiene franjas con más de una cita confirmada (datos previos a la
 * mejora anti-doble-reserva), MongoDB **no podrá construir el índice** y fallará
 * silenciosamente en segundo plano: la garantía nunca llega a aplicarse.
 *
 * Este script localiza esos grupos y, dejando la cita más antigua como buena,
 * marca el resto como `pending_review` para gestión manual (no borra nada).
 *
 * Uso
 * ---
 *   node scripts/cleanup-duplicate-appointments.js          # informe (dry-run)
 *   node scripts/cleanup-duplicate-appointments.js --apply  # aplica los cambios
 *
 * Requiere MONGO_URI en server/.env (igual que el server).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Appointment = require('../src/models/Appointment');

const APPLY = process.argv.includes('--apply');

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('❌ Falta MONGO_URI en el entorno (.env).');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`✅ Conectado a MongoDB${APPLY ? ' (modo APPLY)' : ' (dry-run)'}\n`);

  // Agrupa las confirmadas por la clave única del índice y detecta colisiones.
  const groups = await Appointment.aggregate([
    { $match: { status: 'confirmed' } },
    {
      $group: {
        _id: { date: '$date', time: '$time', stylistId: '$stylist.id' },
        ids: { $push: '$_id' },
        count: { $sum: 1 },
        createdAts: { $push: '$createdAt' },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $sort: { '_id.date': 1, '_id.time': 1 } },
  ]);

  if (groups.length === 0) {
    console.log('✔ No hay duplicados de citas confirmadas. El índice único puede crearse sin problemas.');
    await mongoose.disconnect();
    return;
  }

  console.log(`⚠️ ${groups.length} franja(s) con citas confirmadas duplicadas:\n`);

  let toFix = 0;
  for (const g of groups) {
    const { date, time, stylistId } = g._id;
    // Conserva la cita más antigua (creada primero); el resto se revisa a mano.
    const docs = await Appointment.find({ _id: { $in: g.ids } })
      .sort({ createdAt: 1 })
      .select('_id createdAt client.name')
      .lean();

    const [keep, ...losers] = docs;
    toFix += losers.length;

    console.log(`  • barbero #${stylistId} — ${date} ${time}: ${docs.length} citas`);
    console.log(`      conservar  ${keep._id} (${keep.client?.name || 'sin nombre'})`);
    for (const l of losers) {
      console.log(`      → revisar  ${l._id} (${l.client?.name || 'sin nombre'})`);
    }

    if (APPLY) {
      await Appointment.updateMany(
        { _id: { $in: losers.map(l => l._id) } },
        { $set: { status: 'pending_review' } }
      );
    }
  }

  console.log('');
  if (APPLY) {
    console.log(`✅ Hecho. ${toFix} cita(s) marcadas como pending_review. Ya puedes crear el índice único.`);
  } else {
    console.log(`ℹ️ Dry-run: se marcarían ${toFix} cita(s) como pending_review.`);
    console.log('   Ejecuta de nuevo con --apply para aplicar los cambios.');
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('❌ Error durante la limpieza:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
