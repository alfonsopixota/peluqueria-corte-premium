'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { createAppointmentFromSession } = require('../src/routes/payment');

// --- Test doubles -----------------------------------------------------------

const SESSION = {
  id: 'cs_test_123',
  metadata: {
    userId: 'u1',
    serviceIds: '1,4',
    stylist: JSON.stringify({ id: 3, name: 'Marco' }),
    date: '2026-06-12',
    time: '10:00',
    clientName: 'Ana',
    clientEmail: 'ana@example.com',
    clientPhone: '600600600',
    clientNotes: '',
  },
};

const resolveStub = () => ({
  services: [{ id: 1 }, { id: 4 }],
  totalPrice: 43,
  totalDuration: 75,
});

// Modelo falso configurable: registra documentos guardados y permite simular
// duplicados (idempotencia) y errores 11000 (carreras).
function makeModel({ existing = null, saveBehavior } = {}) {
  const saved = [];
  const findResults = [existing]; // primera llamada de idempotencia

  class FakeAppointment {
    constructor(doc) {
      Object.assign(this, doc);
      this._saveAttempts = 0;
    }

    async save() {
      this._saveAttempts++;
      if (saveBehavior) {
        // saveBehavior puede lanzar (carrera) o no.
        await saveBehavior(this, this._saveAttempts);
      }
      saved.push(this);
      return this;
    }

    static async findOne() {
      return findResults.length ? findResults.shift() : null;
    }
  }

  // Permite encolar resultados adicionales para findOne (p.ej. tras 11000).
  FakeAppointment._queueFind = (v) => findResults.push(v);
  FakeAppointment._saved = saved;
  return FakeAppointment;
}

function noopNotify() {
  return Promise.resolve();
}

// --- Tests ------------------------------------------------------------------

test('idempotencia: si la sesión ya tiene cita, la devuelve sin guardar de nuevo', async () => {
  const already = { _id: 'existing', stripeSessionId: SESSION.id };
  const Model = makeModel({ existing: already });

  const result = await createAppointmentFromSession(SESSION, {
    AppointmentModel: Model,
    resolve: resolveStub,
    conflictCheck: async () => false,
    notify: noopNotify,
  });

  assert.equal(result, already);
  assert.equal(Model._saved.length, 0, 'no debe guardar una segunda cita');
});

test('camino feliz: sin conflicto guarda como confirmed y notifica', async () => {
  const Model = makeModel();
  let notified = null;

  const result = await createAppointmentFromSession(SESSION, {
    AppointmentModel: Model,
    resolve: resolveStub,
    conflictCheck: async () => false,
    notify: (appt) => { notified = appt; return Promise.resolve(); },
  });

  assert.equal(result.status, 'confirmed');
  assert.equal(result.stripeSessionId, SESSION.id);
  assert.equal(result.totalPrice, 43);
  assert.equal(Model._saved.length, 1);
  assert.equal(notified, result, 'debe enviar email de confirmación');
});

test('conflicto previo: guarda como pending_review y NO notifica', async () => {
  const Model = makeModel();
  let notified = false;

  const result = await createAppointmentFromSession(SESSION, {
    AppointmentModel: Model,
    resolve: resolveStub,
    conflictCheck: async () => true, // franja ocupada
    notify: () => { notified = true; return Promise.resolve(); },
  });

  assert.equal(result.status, 'pending_review');
  assert.equal(notified, false, 'no debe enviar email si queda en revisión');
});

test('carrera en stripeSessionId: 11000 y luego encuentra el duplicado → idempotente', async () => {
  const dup = { _id: 'dup', stripeSessionId: SESSION.id };
  const Model = makeModel({
    saveBehavior: () => { const e = new Error('dup key'); e.code = 11000; throw e; },
  });
  // El segundo findOne (dentro del catch) devuelve el duplicado.
  Model._queueFind(dup);

  const result = await createAppointmentFromSession(SESSION, {
    AppointmentModel: Model,
    resolve: resolveStub,
    conflictCheck: async () => false,
    notify: noopNotify,
  });

  assert.equal(result, dup);
  assert.equal(Model._saved.length, 0, 'no debe persistir nada nuevo');
});

test('carrera en franja: 11000 sin duplicado de sesión → reintenta como pending_review', async () => {
  // Primer save lanza 11000; el segundo (ya como pending_review) tiene éxito.
  const Model = makeModel({
    saveBehavior: (doc, attempt) => {
      if (attempt === 1) { const e = new Error('slot taken'); e.code = 11000; throw e; }
    },
  });
  Model._queueFind(null); // no hay duplicado por sessionId

  const result = await createAppointmentFromSession(SESSION, {
    AppointmentModel: Model,
    resolve: resolveStub,
    conflictCheck: async () => false,
    notify: noopNotify,
  });

  assert.equal(result.status, 'pending_review');
  assert.equal(Model._saved.length, 1, 'guarda al reintentar');
  assert.equal(Model._saved[0]._saveAttempts, 2);
});

test('error no-11000 al guardar se propaga', async () => {
  const Model = makeModel({
    saveBehavior: () => { throw new Error('db caída'); },
  });

  await assert.rejects(
    () => createAppointmentFromSession(SESSION, {
      AppointmentModel: Model,
      resolve: resolveStub,
      conflictCheck: async () => false,
      notify: noopNotify,
    }),
    /db caída/
  );
});
