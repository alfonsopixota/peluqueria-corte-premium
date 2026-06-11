'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { hasConflict } = require('../src/utils/appointments');

function fakeModel(returnValue) {
  const calls = [];
  return {
    calls,
    async findOne(query) {
      calls.push(query);
      return returnValue;
    },
  };
}

test('hasConflict: true cuando el modelo encuentra una cita confirmada', async () => {
  const model = fakeModel({ _id: 'x' });
  const result = await hasConflict('2026-06-12', '10:00', 3, model);
  assert.equal(result, true);
});

test('hasConflict: false cuando no hay cita', async () => {
  const model = fakeModel(null);
  const result = await hasConflict('2026-06-12', '10:00', 3, model);
  assert.equal(result, false);
});

test('hasConflict: consulta solo por estado confirmed y normaliza stylistId a número', async () => {
  const model = fakeModel(null);
  await hasConflict('2026-06-12', '10:00', '3', model);
  assert.deepEqual(model.calls[0], {
    date: '2026-06-12',
    time: '10:00',
    'stylist.id': 3,
    status: 'confirmed',
  });
});
